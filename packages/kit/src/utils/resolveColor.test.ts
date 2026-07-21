import { describe, expect, it } from 'vitest'
import type { AppConfig } from '../types'
import { resolveColorHex } from './resolveColor'

const config = (ui: Record<string, unknown>): AppConfig => ({ ui } as AppConfig)

describe('resolveColorHex', () => {
  it('resolves a semantic name through appConfig, then the default mapping', () => {
    expect(resolveColorHex(config({ primary: 'rose' }), 'primary')).toBe('#f43f5e')
    // No override — falls back to SEMANTIC_TO_PALETTE_DEFAULT (primary → green).
    expect(resolveColorHex(config({}), 'primary')).toBe('#22c55e')
    expect(resolveColorHex(config({ gray: 'zinc' }), 'neutral')).toBe('#71717a')
  })

  // `black` / `white` are plain strings in `tailwindcss/colors`, not scales.
  // Indexing them by shade yields undefined, which used to fall through to the
  // slate-500 fallback — so a black accent painted black surfaces with
  // slate-blue baked SVG icons on them.
  it('resolves shade-less colors at every shade', () => {
    expect(resolveColorHex(config({ primary: 'black' }), 'primary')).toBe('#000')
    expect(resolveColorHex(config({ primary: 'black' }), 'primary', 50)).toBe('#000')
    expect(resolveColorHex(config({ primary: 'white' }), 'primary', 600)).toBe('#fff')
  })

  it('falls back for an unknown palette', () => {
    expect(resolveColorHex(config({ primary: 'nope' }), 'primary')).toBe('#64748b')
  })
})
