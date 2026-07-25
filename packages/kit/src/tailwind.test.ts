import { describe, expect, it, vi } from 'vitest'
import { createVyuiPreset } from './tailwind.js'
import { defineVyuiConfig } from './config.js'

/** Structural access — the preset is typed as a deep-partial Tailwind config. */
function colors(preset: unknown): Record<string, unknown> {
  return (preset as any).theme.extend.colors
}

describe('createVyuiPreset', () => {
  it('reads the color set from a defineVyuiConfig result (ui.colors)', () => {
    const preset = createVyuiPreset(defineVyuiConfig({ theme: { colors: ['primary'] } }))

    expect(Object.keys(colors(preset))).toEqual(expect.arrayContaining(['primary', 'neutral']))
    expect(colors(preset).secondary).toBeUndefined()
  })

  it('still accepts the flat options form', () => {
    const preset = createVyuiPreset({ colors: ['primary', 'secondary'] })
    expect(colors(preset).secondary).toBeDefined()
  })

  it('warns about custom semantic colors that need matching CSS vars', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    createVyuiPreset(defineVyuiConfig({ theme: { colors: ['primary', 'brand'] } }))

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('brand'))
    warn.mockRestore()
  })

  it('does not warn for the default package color set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createVyuiPreset()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  describe('exact theme safelist', () => {
    const stringEntries = (preset: unknown): string[] =>
      ((preset as any).safelist as unknown[]).filter((e): e is string => typeof e === 'string')

    it('contains the concrete color classes the themes emit', () => {
      const strings = stringEntries(createVyuiPreset())
      // button solid fill (template literal over colors)
      expect(strings).toContain('bg-primary-500')
      // tabs pill label — group-scoped ui-state variant on a child slot
      expect(strings).toContain('group-ui-active:text-white')
      // input focus ring — arbitrary-value shadow literal
      expect(strings).toContain('shadow-[0_0_0_2px_var(--ui-color-primary-200)]')
    })

    it('tracks a custom color set', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const strings = stringEntries(createVyuiPreset({ colors: ['primary', 'brand'] }))
      expect(strings).toContain('bg-brand-500')
      expect(strings.some(s => s.includes('secondary'))).toBe(false)
      warn.mockRestore()
    })

    it('carries none of the dead data-[…] / ring-* combinations', () => {
      const strings = stringEntries(createVyuiPreset())
      expect(strings.some(s => s.includes('data-['))).toBe(false)
      expect(strings.some(s => /^ring-/.test(s))).toBe(false)
    })

    it('restricts to the requested components plus their internal dependencies', () => {
      const all = stringEntries(createVyuiPreset())
      const filtered = stringEntries(createVyuiPreset({ components: ['modal'] }))

      expect(filtered.length).toBeLessThan(all.length)
      filtered.forEach(s => expect(all).toContain(s))
      // modal → button (rendered internally) → its solid fill must survive
      expect(filtered).toContain('bg-primary-500')
      // tabs is not in the closure — its pill-label class must be gone
      expect(filtered).not.toContain('group-ui-active:text-white')
    })

    // Regression: `slider`'s md thumb was `size-4.5`. Tailwind v3's spacing
    // scale stops fractional steps at 3.5, so the class compiled to nothing and
    // the default thumb rendered 0×0 — safelisted, no build error, no CSS.
    it('emits no fractional spacing step outside Tailwind v3s scale', () => {
      const VALID_HALF_STEPS = ['0.5', '1.5', '2.5', '3.5']
      const offenders = stringEntries(createVyuiPreset())
        .filter(s => /-\d+\.5(?:$|\/)/.test(s))
        .filter(s => !VALID_HALF_STEPS.some(step => s.endsWith(`-${step}`)))
      expect(offenders).toEqual([])
    })

    it('warns about unknown component theme names', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createVyuiPreset({ components: ['button', 'nope'] })
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('nope'))
      warn.mockRestore()
    })
  })
})
