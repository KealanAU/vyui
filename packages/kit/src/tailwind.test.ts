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
})
