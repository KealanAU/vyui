// vyui build-time worklet transform, as a Vite/Rollup plugin.
//
// Port of the webpack `worklet-loader.cjs`. Runs `enforce: 'post'` (after
// `@vitejs/plugin-vue` compiles SFCs and esbuild strips TS) on any module whose
// code still carries a `'main thread'` directive. It invokes
// `transformReactLynxSync` with `target: LEPUS` to emit
// `registerWorkletInternal(...)` registrations alongside the `_wkltId`
// placeholder replacement, then rewrites the runtime gate.
//
// This mirrors vue-lynx's `worklet-loader-mt` but unified for library
// publication: consumers don't run the loader over `node_modules`, so each
// published `'main thread'` module must self-register. Per-file (unbundled)
// output keeps direct named `vue-lynx` imports, which is exactly what the
// consumer's MT worklet toolchain assumes — a bundle turns them into a webpack
// external namespace that the consumer's registration slicing then orphans.
//
// `@lynx-js/react/transform` is required lazily, resolved relative to the file
// being transformed, so packages with zero worklets (e.g. @vyui/kit) can wire
// this plugin for parity without depending on `@lynx-js/react`.

import { createRequire } from 'node:module'
import { transformSync } from 'esbuild'

// `runtimePkg` is just the import source SWC writes for the worklet runtime
// gate (`loadWorkletRuntime`). We pass `vue-lynx` to match vue-lynx's own
// loader output and then strip the gate import in post-processing — there's no
// real consumer pipeline to satisfy with it, the gate just decides whether
// `registerWorkletInternal(...)` runs on this side. Two reasons we can't keep
// the import as-is:
//
//   1. vue-lynx doesn't actually re-export `loadWorkletRuntime`. Its own loader
//      rewrites the `with { runtime: 'shared' }` import via
//      `!!builtin:swc-loader!@lynx-js/react/internal` so consumers never see
//      the bare specifier; we don't have that pipeline so the import lands as a
//      normal vue-lynx import and the consumer fails with
//      `ESModulesLinkingError: export 'loadWorkletRuntime' was not found in
//      'vue-lynx'`.
//   2. Importing `@lynx-js/react/internal` directly pulls `snapshot.js` into
//      module-init and crashes the consumer's BG bundle with `loadCard failed
//      ReferenceError: __JS__ is not defined` before any user code runs.
//
// The gate's only job at runtime is "is this MT or BG?" — we inline that check
// against `globalThis.lynxWorkletImpl` (the same object `loadWorkletRuntime`
// would have returned). The result: each `'main thread'` body still registers
// on MT and does nothing on BG, with zero runtime imports from
// worklet-internals.
const RUNTIME_PKG = 'vue-lynx'

// Match the import line SWC emits for the runtime gate. The exact shape varies
// slightly (named imports, multiple symbols, optional `with { runtime:
// 'shared' }` attribute) — match it broadly.
export const RUNTIME_IMPORT_RE = /import\s*\{[^}]*loadWorkletRuntime[^}]*\}\s*from\s*['"]vue-lynx['"]\s*(?:with\s*\{[^}]*\})?\s*;?\s*\n?/g

// SWC aliases the imported symbol before use:
//   `import { loadWorkletRuntime as __loadWorkletRuntime } from "vue-lynx";`
//   `var loadWorkletRuntime = __loadWorkletRuntime;`
// Once the import is stripped, this alias reads a now-undeclared identifier. In
// the old bundled build, rspack's DCE removed the dead binding entirely. Under
// per-file `preserveModules`, Rollup instead drops only the unused `var` name
// and keeps the initializer as a bare `__loadWorkletRuntime;` statement — an
// undeclared reference that throws `ReferenceError` at module load (ESM is
// always strict). Strip the whole alias so no `loadWorkletRuntime` reference
// survives.
const RUNTIME_ALIAS_RE = /(?:var|let|const)\s+loadWorkletRuntime\s*=\s*__loadWorkletRuntime\s*;?\s*\n?/g

export function inlineRuntimeGate(code) {
  // Drop the gate's import and its dead alias — we don't need either.
  let out = code.replace(RUNTIME_IMPORT_RE, '').replace(RUNTIME_ALIAS_RE, '')
  // Rewrite every call site. SWC emits patterns like
  //   `loadWorkletRuntime(ctx) && registerWorkletInternal(...)`
  //   `loadWorkletRuntime(ctx)` (bare)
  // Replace the call with the inline MT-presence check.
  out = out.replace(/loadWorkletRuntime\s*\([^)]*\)/g, '(typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl)')
  return out
}

function hasDirective(code) {
  return code.includes('\'main thread\'') || code.includes('"main thread"')
}

// Resolve `@lynx-js/react/transform` relative to the module being built so the
// plugin doesn't need to be a dependency of a worklet-free package.
const transformCache = new Map()
function loadTransform(id) {
  const base = id.split('?')[0]
  const key = base || process.cwd()
  if (transformCache.has(key)) return transformCache.get(key)
  const require = createRequire(base && base.startsWith('/') ? base : `${process.cwd()}/noop.js`)
  const { transformReactLynxSync } = require('@lynx-js/react/transform')
  transformCache.set(key, transformReactLynxSync)
  return transformReactLynxSync
}

/**
 * Transform a single module's worklets. Returns the rewritten code, or `null`
 * when the module has no `'main thread'` directive (leave it untouched).
 *
 * @param {string} code
 * @param {string} id
 * @returns {string | null}
 */
export function transformWorklet(code, id) {
  if (!hasDirective(code)) return null
  const filename = id.split('?')[0]
  const isTs = /\.[cm]?tsx?$/.test(filename)
  const transformReactLynxSync = loadTransform(id)
  const result = transformReactLynxSync(code, {
    pluginName: 'vyui:worklet',
    filename,
    sourcemap: false,
    cssScope: false,
    shake: false,
    compat: false,
    refresh: false,
    defineDCE: false,
    directiveDCE: false,
    worklet: { target: 'LEPUS', filename, runtimePkg: RUNTIME_PKG },
    syntaxConfig: isTs ? JSON.stringify({ syntax: 'typescript' }) : undefined,
  })
  if (result.errors && result.errors.length > 0) {
    throw new Error(`[vyui:worklet] ${filename}: ${result.errors.map((e) => e.text).join('; ')}`)
  }
  return reAddMainThreadMarker(stripComments(stripBodyDirectives(inlineRuntimeGate(result.code))))
}

// Comment-strip worklet modules (esbuild drops normal comments, keeps
// @__PURE__ and legal comments). The consumer's `worklet-loader-mt` slices our
// registrations out of this file with hand-rolled text scanners that have
// repeatedly choked on comment content inside registration bodies (0.4.2
// counts parens in comments; 0.5.x's findBalancedEnd misreads apostrophes —
// see docs/upstream/vue-lynx-mt-worklet-import-issue.md). Comment-free bodies
// are extraction-proof for every scanner generation; native-compat.test.mjs
// enforces the invariant on dist.
function stripComments(code) {
  return transformSync(code, { loader: 'js', charset: 'utf8' }).code
}

// SWC leaves a bare `'main thread';` directive inside some registration bodies.
// When the consumer's `worklet-loader-mt` re-transforms our dist, it re-detects
// those as fresh worklets and emits a second, spurious registration (the
// documented 157→159 double-transform). Harmless (our id still registers) but
// untidy. Strip the leftover directive statements so the consumer sees exactly
// our pre-compiled registrations — the single top-level marker added by
// `reAddMainThreadMarker` is what carries the loader's gate. Matches only a
// whole-line quoted `main thread` statement, never the marker assignment or a
// `'main thread'` used as a value.
function stripBodyDirectives(code) {
  return code.replace(/(^|\n)[ \t]*(['"])main thread\2\s*;?[ \t]*(?=\n|$)/g, '$1')
}

// CRITICAL for npm consumers: the worklet pre-compile consumes the `'main
// thread'` directive (SWC moves it into the registration body and usually
// drops the literal). But the consumer's `worklet-loader-mt` gates registration
// extraction on the module *still containing* the string `'main thread'` /
// `"main thread"`:
//
//   if (!source.includes("'main thread'") && !source.includes('"main thread"'))
//     return localImports + 'export default {};'   // ← drops ALL registrations
//
// Without the marker, the consumer's MT bundle gets our imports but none of our
// `registerWorkletInternal(...)` calls, so the worklets never register on the
// main thread and the first gesture throws `cannot read property 'bind' of
// undefined`.
//
// Re-add the marker as a global assignment rather than a bare `"main thread";`
// directive: Rollup hoists imports above a leading directive and then drops it
// as a no-op, but it always keeps an assignment to a global (a side effect).
// The statement is inert (idempotent global write, evaluated only in our
// background bundle — the consumer's MT loader strips everything except the
// registrations) and the consumer's re-transform ignores it, re-emitting our
// registrations with the same `_wkltId`s the background bundle already
// references. Verified end-to-end on device (picknic).
const MT_MARKER = 'globalThis.__vyuiWorkletModule = "main thread";\n'

function reAddMainThreadMarker(code) {
  if (!code.includes('registerWorkletInternal(')) return code
  // Inject unconditionally: SWC keeps `'main thread'` as a directive inside the
  // registration function bodies, but Rollup strips unrecognized function-body
  // directives on output — so the string is gone from the published dist even
  // when it survives our transform. The global-assignment marker is a top-level
  // side effect Rollup keeps. Skip only if a *top-level* marker is already
  // present (idempotent).
  if (code.includes(MT_MARKER.trim())) return code
  return MT_MARKER + code
}

/**
 * Vite/Rollup plugin that pre-compiles vyui worklets per file.
 *
 * @returns {import('vite').Plugin}
 */
export function vyuiWorkletPlugin() {
  return {
    name: 'vyui:worklet',
    enforce: 'post',
    transform(code, id) {
      let out
      try {
        out = transformWorklet(code, id)
      } catch (err) {
        this.error(err instanceof Error ? err.message : String(err))
        return null
      }
      if (out == null) return null
      // SWC rebuilds the module wholesale; drop the upstream sourcemap rather
      // than ship a stale one.
      return { code: out, map: null }
    },
  }
}
