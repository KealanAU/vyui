// Regression pin for the regex-based post-processing in
// `worklet-loader.cjs`. The loader strips the `loadWorkletRuntime`
// import (vue-lynx doesn't re-export it) and rewrites each call site
// to an inline `globalThis.lynxWorkletImpl` gate. If a future SWC
// version changes its emitted call shape, the regex can silently miss
// and the published `@vyui/core` dist breaks at runtime with
// `bind of undefined`. These tests pin current behavior — they are
// regression tests, not aspirational ones.

import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { inlineRuntimeGate, RUNTIME_IMPORT_RE } = require('./worklet-loader.cjs')

const INLINE_GATE = '(typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl)'

describe('worklet-loader: inlineRuntimeGate', () => {
  it('passes through empty input unchanged', () => {
    expect(inlineRuntimeGate('')).toBe('')
  })

  it('leaves modules without worklet artifacts untouched', () => {
    const src = 'export const foo = 1;\n'
    expect(inlineRuntimeGate(src)).toBe(src)
  })

  it('strips a bare loadWorkletRuntime import if it sneaks into a worklet-less module', () => {
    const src = `import { loadWorkletRuntime as __loadWorkletRuntime } from "vue-lynx";\nexport const foo = 1;\n`
    const out = inlineRuntimeGate(src)
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).not.toMatch(/from\s*['"]vue-lynx['"]/)
    expect(out).toContain('export const foo = 1;')
  })

  it('rewrites realistic SWC-emitted worklet output (BG/MT-safe shape)', () => {
    // Captured by invoking `transformReactLynxSync` with target=LEPUS
    // against a `'main thread'` directive function.
    const swc = [
      `import { loadWorkletRuntime as __loadWorkletRuntime } from "vue-lynx";`,
      `var loadWorkletRuntime = __loadWorkletRuntime;`,
      `function useMtSmoke() {`,
      `    let tap = {`,
      `        _wkltId: "ca17:7f2b9:1"`,
      `    };`,
      `    return { tap };`,
      `}`,
      `export { useMtSmoke };`,
      `const __workletRuntimeLoaded = loadWorkletRuntime(typeof globDynamicComponentEntry === 'undefined' ? undefined : globDynamicComponentEntry);`,
      `__workletRuntimeLoaded && registerWorkletInternal("main-thread", "ca17:7f2b9:1", function() {`,
      `    const tap = lynxWorkletImpl._workletMap["ca17:7f2b9:1"].bind(this);`,
      `    'main thread';`,
      `    console.log('hello');`,
      `});`,
      ``,
    ].join('\n')

    const out = inlineRuntimeGate(swc)

    // The named import line must be gone — vue-lynx doesn't re-export
    // loadWorkletRuntime publicly. The aliasing `var` line is left
    // alone (it references the now-undefined symbol but is unreachable
    // because the only call site was rewritten — see below).
    expect(out).not.toMatch(/import\s*\{[^}]*loadWorkletRuntime[^}]*\}\s*from\s*['"]vue-lynx['"]/)

    // Every `loadWorkletRuntime(...)` call expression must be replaced
    // with the inline MT-presence check.
    expect(out).not.toMatch(/loadWorkletRuntime\s*\(/)
    expect(out).toContain(INLINE_GATE)

    // The wklt registration call itself must survive — only the gate
    // call expression is rewritten.
    expect(out).toContain('registerWorkletInternal("main-thread", "ca17:7f2b9:1"')
    expect(out).toContain('_wkltId: "ca17:7f2b9:1"')
  })

  it('handles a multiline pretty-printed loadWorkletRuntime call', () => {
    const src = [
      `import { loadWorkletRuntime } from "vue-lynx";`,
      `const gate = loadWorkletRuntime(`,
      `  ctx`,
      `);`,
      `gate && registerWorkletInternal("x", "y", fn);`,
    ].join('\n')

    const out = inlineRuntimeGate(src)
    // The regex is `/loadWorkletRuntime\s*\([^)]*\)/g` — `[^)]*` does
    // span newlines, so this case IS covered today. Pin it.
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).toContain(INLINE_GATE)
    expect(out).toContain('registerWorkletInternal("x", "y", fn)')
  })

  it('handles a minified single-line loadWorkletRuntime call with no whitespace', () => {
    const src = `import{loadWorkletRuntime}from"vue-lynx";const g=loadWorkletRuntime(ctx)&&registerWorkletInternal("x","y",fn);`
    const out = inlineRuntimeGate(src)
    // RUNTIME_IMPORT_RE allows `\s*` between tokens so the no-space
    // form is matched; the call regex also tolerates no whitespace.
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).toContain(INLINE_GATE)
    expect(out).toContain('registerWorkletInternal("x","y",fn)')
  })

  it('rewrites a hypothetical optional-chained `loadWorkletRuntime(...)?.registerWorklet` shape', () => {
    // Documented for the future: today SWC emits `&& registerWorkletInternal`,
    // not `?.registerWorklet`. If SWC ever switches shapes, the current
    // regex would still rewrite the `loadWorkletRuntime(...)` call
    // expression (leaving `?.registerWorklet(...)` chained onto the
    // inline gate, which is fine because the gate is truthy on MT).
    const src = `loadWorkletRuntime(ctx)?.registerWorklet("x", "y", fn);`
    const out = inlineRuntimeGate(src)
    expect(out).toBe(`${INLINE_GATE}?.registerWorklet("x", "y", fn);`)
  })

  it('is idempotent — re-running on already-processed output is a no-op', () => {
    const once = inlineRuntimeGate(`import { loadWorkletRuntime } from "vue-lynx";\nloadWorkletRuntime(ctx);`)
    const twice = inlineRuntimeGate(once)
    expect(twice).toBe(once)
  })

  it('RUNTIME_IMPORT_RE matches the `with { runtime: \"shared\" }` import attribute form', () => {
    // SWC may emit an import attribute hinting that the import targets
    // the worklet runtime — the regex allows an optional `with { ... }`.
    const src = `import { loadWorkletRuntime } from "vue-lynx" with { runtime: "shared" };\n`
    RUNTIME_IMPORT_RE.lastIndex = 0
    expect(RUNTIME_IMPORT_RE.test(src)).toBe(true)
    expect(inlineRuntimeGate(src)).toBe('')
  })
})
