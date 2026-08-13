import { describe, expect, it } from 'vitest'
import theme, { iconFg } from './toggle'
import { COLORS } from './color-constants.js'

const VARIANTS = ['solid', 'outline', 'soft', 'ghost'] as const

/**
 * The pressed surface has to REST, not only paint under a finger: `ghost` (the
 * default variant) shipped with `active:`-only classes, so an icon-only toggle
 * had no visible on-state at all — nothing changed between off and on.
 */
describe('pressed state is visible at rest', () => {
  const pressedBase = (variant: string) =>
    theme(COLORS).compoundVariants
      .find(c => c.pressed && c.color === 'primary' && c.variant === variant)!
      .class.base as string

  it.each(VARIANTS)('%s paints a resting surface', (variant) => {
    const resting = pressedBase(variant).split(/\s+/).filter(c => !c.startsWith('active:'))
    expect(resting).not.toHaveLength(0)
  })
})

// `text-*` on the icon slot is inert (Lynx rasterizes the SVG), so the on/off
// difference has to come through as two different baked fills.
describe('iconFg', () => {
  it('differs between pressed and unpressed', () => {
    for (const variant of VARIANTS) {
      expect(iconFg('primary', variant, true)).not.toEqual(iconFg('primary', variant, false))
    }
  })

  it('tracks the variant foreground', () => {
    expect(iconFg('primary', 'solid', true)).toBe('white')
    expect(iconFg('success', 'ghost', true)).toEqual({ semantic: 'success', shade: 500 })
    expect(iconFg('primary', 'ghost', false)).toEqual({ semantic: 'neutral', shade: 700 })
    expect(iconFg('primary', 'ghost', false, true)).toEqual({ semantic: 'neutral', shade: 200 })
  })
})
