// Consumers don't run a loader over `node_modules`, so every published
// `'main thread'` module must self-register. Per-file (unbundled) output keeps
// the direct named `vue-lynx` imports the consumer's MT toolchain assumes — a
// bundle turns them into an external namespace its registration slicing then
// orphans.

import { createRequire } from 'node:module'
import { transformSync } from 'esbuild'

// Neither gate import can survive: vue-lynx doesn't re-export
// `loadWorkletRuntime` (`ESModulesLinkingError`), and `@lynx-js/react/internal`
// pulls `snapshot.js` into module-init (`__JS__ is not defined`). The gate only
// answers "MT or BG?", so we inline it against `globalThis.lynxWorkletImpl`.
const RUNTIME_PKG = 'vue-lynx'

// Broad match — SWC's import shape varies (named imports, multiple symbols,
// optional `with { runtime: 'shared' }`).
export const RUNTIME_IMPORT_RE = /import\s*\{[^}]*loadWorkletRuntime[^}]*\}\s*from\s*['"]vue-lynx['"]\s*(?:with\s*\{[^}]*\})?\s*;?\s*\n?/g

// With the import stripped, Rollup keeps SWC's alias initializer as a bare
// `__loadWorkletRuntime;` — an undeclared reference that throws at module load.
const RUNTIME_ALIAS_RE = /(?:var|let|const)\s+loadWorkletRuntime\s*=\s*__loadWorkletRuntime\s*;?\s*\n?/g

export function inlineRuntimeGate(code) {
  let out = code.replace(RUNTIME_IMPORT_RE, '').replace(RUNTIME_ALIAS_RE, '')
  out = out.replace(/loadWorkletRuntime\s*\([^)]*\)/g, '(typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl)')
  return out
}

function hasDirective(code) {
  return code.includes('\'main thread\'') || code.includes('"main thread"')
}

// Resolved relative to the module being built so worklet-free packages
// (@vyui/kit) can wire this plugin without depending on `@lynx-js/react`.
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
 * @param {string} code
 * @param {string} id
 * @returns {string | null} `null` when the module has no `'main thread'` directive.
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

// The consumer's `worklet-loader-mt` slices our registrations out with
// hand-rolled text scanners that choke on comment content (see
// docs/upstream/vue-lynx-mt-worklet-import-issue.md). native-compat.test.mjs
// enforces comment-free dist.
function stripComments(code) {
  return transformSync(code, { loader: 'js', charset: 'utf8' }).code
}

// A bare `'main thread';` left inside a registration body makes the consumer's
// re-transform register it a second time. Whole-line quoted statements only —
// never the marker assignment below, which is what carries the loader's gate.
function stripBodyDirectives(code) {
  return code.replace(/(^|\n)[ \t]*(['"])main thread\2\s*;?[ \t]*(?=\n|$)/g, '$1')
}

// CRITICAL for npm consumers: the pre-compile consumes the `'main thread'`
// literal, but `worklet-loader-mt` gates registration extraction on the module
// still containing it — without the marker it drops ALL our registrations and
// the first gesture throws `cannot read property 'bind' of undefined`. An
// assignment, not a directive: Rollup drops a leading directive as a no-op.
const MT_MARKER = 'globalThis.__vyuiWorkletModule = "main thread";\n'

function reAddMainThreadMarker(code) {
  if (!code.includes('registerWorkletInternal(')) return code
  if (code.includes(MT_MARKER.trim())) return code
  return MT_MARKER + code
}

/** @returns {import('vite').Plugin} */
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
      // SWC rebuilds the module wholesale — an upstream sourcemap would be stale.
      return { code: out, map: null }
    },
  }
}
