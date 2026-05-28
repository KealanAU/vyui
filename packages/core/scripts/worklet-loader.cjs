// @vyui/core build-time worklet loader.
//
// Runs on every .ts/.tsx/.vue (post-vue-loader) module during the rslib
// build. If the module contains `'main thread'`, invoke
// `transformReactLynxSync` with `target: LEPUS` to emit
// `registerWorkletInternal(...)` calls alongside the `_wkltId` placeholder
// replacement.
//
// This mirrors vue-lynx's `worklet-loader-mt.js` but unified for library
// publication, so consumers don't need to run the loader themselves.

const { transformReactLynxSync } = require('@lynx-js/react/transform')

// `runtimePkg` is just the import source SWC writes for the worklet
// runtime gate (`loadWorkletRuntime`). We pass `vue-lynx` to match
// vue-lynx's own loader output and then strip the gate import in
// post-processing — there's no real consumer pipeline to satisfy with
// it, the gate just decides whether `registerWorkletInternal(...)`
// runs on this side. Two reasons we can't keep the import as-is:
//
//   1. vue-lynx doesn't actually re-export `loadWorkletRuntime`. Its
//      own loader rewrites the `with { runtime: 'shared' }` import via
//      `!!builtin:swc-loader!@lynx-js/react/internal` so consumers
//      never see the bare specifier; we don't have that pipeline so
//      the import lands as a normal vue-lynx import and the consumer
//      fails with `ESModulesLinkingError: export 'loadWorkletRuntime'
//      was not found in 'vue-lynx'`.
//   2. Importing `@lynx-js/react/internal` directly pulls
//      `snapshot.js` into module-init and crashes the consumer's BG
//      bundle with `loadCard failed ReferenceError: __JS__ is not
//      defined` before any user code runs.
//
// The gate's only job at runtime is "is this MT or BG?" — we inline
// that check against `globalThis.lynxWorkletImpl` (the same object
// `loadWorkletRuntime` would have returned). The result: each `'main
// thread'` body still registers on MT and does nothing on BG, with
// zero runtime imports from worklet-internals.
const RUNTIME_PKG = 'vue-lynx'

// Match the import line SWC emits for the runtime gate. The exact
// shape varies slightly (named imports, multiple symbols, optional
// `with { runtime: 'shared' }` attribute) — match it broadly.
const RUNTIME_IMPORT_RE = /import\s*\{[^}]*loadWorkletRuntime[^}]*\}\s*from\s*['"]vue-lynx['"]\s*(?:with\s*\{[^}]*\})?\s*;?\s*\n?/g

function inlineRuntimeGate(code) {
  // Drop the gate's import — we don't need it.
  let out = code.replace(RUNTIME_IMPORT_RE, '')
  // Rewrite every call site. SWC emits patterns like
  //   `loadWorkletRuntime(ctx) && registerWorkletInternal(...)`
  //   `loadWorkletRuntime(ctx)` (bare)
  // Replace the call with the inline MT-presence check.
  out = out.replace(/loadWorkletRuntime\s*\([^)]*\)/g, '(typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl)')
  return out
}

function workletLoader(source) {
  this.cacheable && this.cacheable(true)
  if (!source.includes('\'main thread\'') && !source.includes('"main thread"')) {
    return source
  }
  const filename = this.resourcePath
  const isTs = /\.tsx?$/.test(filename)
  try {
    const result = transformReactLynxSync(source, {
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
      for (const e of result.errors) {
        this.emitError(new Error(`[vyui:worklet-loader] ${filename}: ${e.text}`))
      }
      return source
    }
    return inlineRuntimeGate(result.code)
  } catch (err) {
    this.emitError(new Error(`[vyui:worklet-loader] ${filename}: ${err.message}`))
    return source
  }
}

module.exports = workletLoader
// Exported for unit tests — pins regex-based post-processing behavior.
// Runtime behavior is unchanged; the loader itself still calls
// `inlineRuntimeGate` internally above.
module.exports.inlineRuntimeGate = inlineRuntimeGate
module.exports.RUNTIME_IMPORT_RE = RUNTIME_IMPORT_RE
