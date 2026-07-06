// Pins the deep-import rewrite that makes kit's subpath entries actually
// shake: kit dist must never re-enter @vyui/core through its barrel (the
// vue-lynx MT pipeline prunes by `sideEffects` globs alone, so one barrel
// import re-ships every core worklet — see package.json `//sideEffects`).
// The rewrite must be exact-or-fail: a silently skipped statement shape would
// quietly restore the everything-ships behavior.

import { describe, it, expect } from 'vitest'
import { parseBarrel, rewriteModule } from '@vyui/shared-build-config/rewrite-deep-imports'

// The Rollup preserveModules barrel shape @vyui/core actually emits: named
// imports (SFC defaults bound as `default as defaultN`) + one export block.
const barrel = [
  'import "./components/Presence/presence.css";',
  'import { default as default2 } from "./components/Icon/Icon.vue.js";',
  'import { default as default3, injectSheetRootContext } from "./components/Sheet/SheetRoot.vue.js";',
  'import { useAnimate } from "./shared/useAnimate.js";',
  'export {',
  '  default2 as Icon,',
  '  default3 as SheetRoot,',
  '  injectSheetRootContext,',
  '  useAnimate',
  '};',
].join('\n')

describe('parseBarrel', () => {
  it('maps exported names through local bindings to defining modules', () => {
    const map = parseBarrel(barrel)
    expect(map.get('Icon')).toEqual({ module: './components/Icon/Icon.vue.js', imported: 'default' })
    expect(map.get('SheetRoot')).toEqual({ module: './components/Sheet/SheetRoot.vue.js', imported: 'default' })
    expect(map.get('useAnimate')).toEqual({ module: './shared/useAnimate.js', imported: 'useAnimate' })
    expect(map.size).toBe(4)
  })

  it('throws on exports the barrel defines inline (deep imports cannot reach them)', () => {
    expect(() => parseBarrel('const x = 1;\nexport { x };')).toThrow(/defines 'x' inline/)
  })
})

describe('rewriteModule', () => {
  const map = parseBarrel(barrel)

  it('rewrites named imports to per-file specifiers, grouped by module', () => {
    const out = rewriteModule(
      'import { SheetRoot, injectSheetRootContext, useAnimate } from "@vyui/core";\nconsole.log(SheetRoot);',
      '@vyui/core',
      map,
    )
    expect(out).toContain(
      'import { default as SheetRoot, injectSheetRootContext } from "@vyui/core/dist/components/Sheet/SheetRoot.vue.js";',
    )
    expect(out).toContain('import { useAnimate } from "@vyui/core/dist/shared/useAnimate.js";')
    expect(out).not.toMatch(/["']@vyui\/core["']/)
  })

  it('rewrites export-from statements (kit index re-exports core primitives)', () => {
    const out = rewriteModule('export { Icon as VyIcon } from "@vyui/core";', '@vyui/core', map)
    expect(out).toBe('export { default as VyIcon } from "@vyui/core/dist/components/Icon/Icon.vue.js";')
  })

  it('returns null for modules that never touch the barrel', () => {
    expect(rewriteModule('import { ref } from "vue";', '@vyui/core', map)).toBeNull()
  })

  it('fails the build on shapes it cannot preserve', () => {
    expect(() => rewriteModule('import * as core from "@vyui/core";', '@vyui/core', map)).toThrow(/unsupported/)
    expect(() => rewriteModule('import Core from "@vyui/core";', '@vyui/core', map)).toThrow(/unsupported/)
    expect(() => rewriteModule('export * from "@vyui/core";', '@vyui/core', map)).toThrow(/unsupported/)
    expect(() => rewriteModule('import { NotAThing } from "@vyui/core";', '@vyui/core', map)).toThrow(
      /'NotAThing' is not exported/,
    )
  })
})
