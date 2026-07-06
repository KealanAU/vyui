// Regression pin for the worklet pre-compile shared by the Vite build
// (`@vyui/shared-build-config/vite-worklet-plugin`). The transform strips the
// `loadWorkletRuntime` import + its alias (vue-lynx doesn't re-export it) and
// rewrites each call site to an inline `globalThis.lynxWorkletImpl` gate. If a
// future SWC version changes its emitted shape, the regex can silently miss and
// the published `@vyui/core` dist breaks at runtime with `bind of undefined`
// (or a `ReferenceError` from a leftover `__loadWorkletRuntime`). These tests
// pin current behavior — they are regression tests, not aspirational ones.

import { describe, it, expect } from 'vitest'
import { inlineRuntimeGate, RUNTIME_IMPORT_RE, transformWorklet } from '@vyui/shared-build-config/vite-worklet-plugin'

const INLINE_GATE = '(typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl)'

describe('worklet plugin: inlineRuntimeGate', () => {
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
    // Captured by invoking `transformReactLynxSync` with target=LEPUS against a
    // `'main thread'` directive function.
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

    // The import AND its dead alias must be gone — vue-lynx doesn't re-export
    // loadWorkletRuntime, and under per-file preserveModules Rollup would
    // otherwise reduce the alias to a bare `__loadWorkletRuntime;` that throws
    // a ReferenceError at module load. No `loadWorkletRuntime`/
    // `__loadWorkletRuntime` reference may survive.
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).not.toMatch(/__loadWorkletRuntime/)

    // Every `loadWorkletRuntime(...)` call must become the inline MT-presence
    // check.
    expect(out).toContain(INLINE_GATE)

    // The wklt registration itself must survive — only the gate is rewritten.
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
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).toContain(INLINE_GATE)
    expect(out).toContain('registerWorkletInternal("x", "y", fn)')
  })

  it('handles a minified single-line loadWorkletRuntime call with no whitespace', () => {
    const src = `import{loadWorkletRuntime}from"vue-lynx";const g=loadWorkletRuntime(ctx)&&registerWorkletInternal("x","y",fn);`
    const out = inlineRuntimeGate(src)
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).toContain(INLINE_GATE)
    expect(out).toContain('registerWorkletInternal("x","y",fn)')
  })

  it('is idempotent — re-running on already-processed output is a no-op', () => {
    const once = inlineRuntimeGate(`import { loadWorkletRuntime } from "vue-lynx";\nvar loadWorkletRuntime = __loadWorkletRuntime;\nloadWorkletRuntime(ctx);`)
    const twice = inlineRuntimeGate(once)
    expect(twice).toBe(once)
    expect(once).not.toMatch(/loadWorkletRuntime/)
  })

  it('RUNTIME_IMPORT_RE matches the `with { runtime: "shared" }` import attribute form', () => {
    const src = `import { loadWorkletRuntime } from "vue-lynx" with { runtime: "shared" };\n`
    RUNTIME_IMPORT_RE.lastIndex = 0
    expect(RUNTIME_IMPORT_RE.test(src)).toBe(true)
    expect(inlineRuntimeGate(src)).toBe('')
  })
})

describe('worklet plugin: transformWorklet (end-to-end via @lynx-js/react/transform)', () => {
  it('returns null for a module with no `main thread` directive', () => {
    expect(transformWorklet('export const foo = 1\n', `${import.meta.dirname}/x.ts`)).toBeNull()
  })

  it('compiles a `main thread` worklet to a self-registering, import-free module', () => {
    const src = [
      `export function onTap(x) {`,
      `  'main thread'`,
      `  return x + 1`,
      `}`,
    ].join('\n')
    const out = transformWorklet(src, `${import.meta.dirname}/onTap.ts`)
    expect(out).toBeTypeOf('string')
    // Self-registers on the main thread…
    expect(out).toMatch(/registerWorkletInternal\(\s*["']main-thread["']/)
    // …with the inlined gate and zero worklet-runtime imports.
    expect(out).toContain(INLINE_GATE)
    expect(out).not.toMatch(/loadWorkletRuntime/)
    expect(out).not.toMatch(/import[^\n]*worklet-runtime/)
    // …and carries the top-level `"main thread"` marker the consumer's MT
    // loader gates registration extraction on (regression guard for the
    // `bind of undefined` device crash).
    expect(out).toContain('globalThis.__vyuiWorkletModule = "main thread"')
    // The leftover in-body directive is stripped so the consumer's re-transform
    // doesn't double-register: the only `main thread` string is the marker.
    expect(out.match(/main thread/g)).toHaveLength(1)
  })
})
