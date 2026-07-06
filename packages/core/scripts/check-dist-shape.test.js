// The "Phase 0" guard proof for the Vite preserveModules migration
// (docs/plans/vite-preserve-modules-dist.md): the dist-shape detector must be
// RED on the bundled shape that crashed npm consumers of VyTray/VyDrawer
// (`__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined`) and GREEN on the
// source-shaped, per-file output the migration produces. This pins that
// contract deterministically, without a full rspeedy consumer build.

import { describe, it, expect } from 'vitest'
import { scanModule } from '@vyui/shared-build-config/check-dist-shape'

describe('check-dist-shape: RED on the bundled Tray-bug shape', () => {
  it('flags the webpack external namespace fingerprint', () => {
    // Exactly the shape rslib bundling emitted: vue-lynx becomes a namespace,
    // and worklet bodies call through it.
    const bundled = [
      'import * as __WEBPACK_EXTERNAL_MODULE_vue_lynx_dbb0f2d9__ from "vue-lynx";',
      'registerWorkletInternal("main-thread", "abcd:1", function() {',
      '  (0, __WEBPACK_EXTERNAL_MODULE_vue_lynx_dbb0f2d9__.runOnBackground)(x);',
      '});',
    ].join('\n')
    const { why } = scanModule('index.js', bundled)
    expect(why.some((w) => /__WEBPACK_EXTERNAL_MODULE_/.test(w))).toBe(true)
    expect(why.some((w) => /namespace import of 'vue-lynx'/.test(w))).toBe(true)
  })

  it('flags an orphaned _workletMap reference with no in-file registration', () => {
    const orphaned = 'foo._workletMap["main-thread/xy:1"].bind(this);'
    const { why } = scanModule('orphan.js', orphaned)
    expect(why.some((w) => /_workletMap\["main-thread\/xy:1"\]/.test(w))).toBe(true)
  })

  it('flags a leftover loadWorkletRuntime reference', () => {
    const { why } = scanModule('leak.js', 'var loadWorkletRuntime = __loadWorkletRuntime;')
    expect(why.some((w) => /loadWorkletRuntime/.test(w))).toBe(true)
  })

  it('flags a leaked ?vue&type= specifier', () => {
    const { why } = scanModule('leak.vue.js', 'import x from "./Foo.vue?vue&type=script&lang.ts";')
    expect(why.some((w) => /\?vue&type=/.test(w))).toBe(true)
  })

  it('flags a worklet module missing the `main thread` marker (consumer drops its registrations)', () => {
    // A registration with no `'main thread'` string anywhere — the consumer's
    // MT loader would replace this module with `export default {}`.
    const noMarker = 'registerWorkletInternal("main-thread", "abcd:1", function(){ return 1 });'
    const { why } = scanModule('nomarker.js', noMarker)
    expect(why.some((w) => /marker/.test(w))).toBe(true)
  })
})

describe('check-dist-shape: GREEN on the source-shaped output', () => {
  it('passes a per-file worklet module with named imports and an inlined gate', () => {
    const sourceShaped = [
      'import { runOnBackground, useMainThreadRef } from "vue-lynx";',
      'let onTap = { _wkltId: "abcd:1" };',
      'export { onTap };',
      'const __workletRuntimeLoaded = typeof globalThis !== "undefined" && globalThis.lynxWorkletImpl;',
      '__workletRuntimeLoaded && registerWorkletInternal("main-thread", "abcd:1", function() {',
      '  const _ = lynxWorkletImpl._workletMap["abcd:1"].bind(this);',
      '  "main thread";',
      '  runOnBackground(useMainThreadRef);',
      '});',
    ].join('\n')
    const res = scanModule('Slider.vue.js', sourceShaped)
    expect(res.why).toEqual([])
    expect(res.isWorklet).toBe(true)
    expect(res.registrations).toBe(1)
  })

  it('passes an ordinary non-worklet module', () => {
    const res = scanModule('Button.vue.js', 'import { defineComponent } from "vue";\nexport default defineComponent({});')
    expect(res.why).toEqual([])
    expect(res.isWorklet).toBe(false)
  })
})
