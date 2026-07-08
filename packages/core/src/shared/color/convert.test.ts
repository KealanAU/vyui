// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import type { HSBColor, HSLColor, RGBColor } from './types'
import { describe, expect, it } from 'vitest'
import {
  colorToHex,
  colorToHsb,
  colorToHsl,
  colorToRgb,
  colorToString,
  convertToHsb,
  convertToHsl,
  convertToRgb,
  hsbToRgb,
  hslToRgb,
  rgbToHsb,
  rgbToHsl,
} from './convert'

describe('colorToString', () => {
  const rgb: RGBColor = { space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 }

  it('dispatches to the matching formatter for each format', () => {
    expect(colorToString(rgb, 'hex')).toBe('#ff0000')
    expect(colorToString(rgb, 'rgb')).toBe('rgb(255, 0, 0)')
    expect(colorToString(rgb, 'hsl')).toBe('hsl(0, 100%, 50%)')
    expect(colorToString(rgb, 'hsb')).toBe('hsb(0, 100%, 100%)')
  })

  it('defaults to hex when no format is given', () => {
    expect(colorToString(rgb)).toBe('#ff0000')
  })

  it('throws for an unknown format', () => {
    expect(() => colorToString(rgb, 'bogus' as any)).toThrow()
  })
})

describe('colorToHex', () => {
  it('converts RGB to hex, zero-padding single-digit channels', () => {
    expect(colorToHex({ space: 'rgb', r: 255, g: 128, b: 5, alpha: 1 })).toBe('#ff8005')
  })

  it('converts a non-RGB color via convertToRgb', () => {
    expect(colorToHex({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })).toBe('#ff0000')
  })

  it('appends the alpha byte only when alpha < 1', () => {
    expect(colorToHex({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })).toBe('#ff0000')
    expect(colorToHex({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 0.5 })).toBe('#ff000080')
  })
})

describe('colorToRgb', () => {
  it('formats an opaque color as rgb()', () => {
    expect(colorToRgb({ space: 'rgb', r: 255, g: 128, b: 64, alpha: 1 })).toBe('rgb(255, 128, 64)')
  })

  it('formats a transparent color as rgba()', () => {
    expect(colorToRgb({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 0.5 })).toBe('rgba(255, 0, 0, 0.5)')
  })

  it('rounds fractional channel values', () => {
    expect(colorToRgb({ space: 'rgb', r: 1.4, g: 2.6, b: 3.5, alpha: 1 })).toBe('rgb(1, 3, 4)')
  })
})

describe('colorToHsl', () => {
  it('formats an opaque color as hsl()', () => {
    expect(colorToHsl({ space: 'hsl', h: 120, s: 50, l: 50, alpha: 1 })).toBe('hsl(120, 50%, 50%)')
  })

  it('formats a transparent color as hsla()', () => {
    expect(colorToHsl({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 0.5 })).toBe('hsla(0, 100%, 50%, 0.5)')
  })

  it('converts a non-HSL color via convertToHsl', () => {
    expect(colorToHsl({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })).toBe('hsl(0, 100%, 50%)')
  })
})

describe('colorToHsb', () => {
  it('formats an opaque color as hsb()', () => {
    expect(colorToHsb({ space: 'hsb', h: 0, s: 100, b: 100, alpha: 1 })).toBe('hsb(0, 100%, 100%)')
  })

  it('formats a transparent color as hsba()', () => {
    expect(colorToHsb({ space: 'hsb', h: 0, s: 100, b: 100, alpha: 0.5 })).toBe('hsba(0, 100%, 100%, 0.5)')
  })

  it('converts a non-HSB color via convertToHsb', () => {
    expect(colorToHsb({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })).toBe('hsb(0, 100%, 100%)')
  })
})

describe('convertToRgb', () => {
  it('returns an RGB color unchanged (same reference)', () => {
    const rgb: RGBColor = { space: 'rgb', r: 1, g: 2, b: 3, alpha: 1 }
    expect(convertToRgb(rgb)).toBe(rgb)
  })

  it('converts HSL to RGB', () => {
    const result = convertToRgb({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })
    expect(result.space).toBe('rgb')
    expect(result.r).toBeCloseTo(255, 0)
    expect(result.g).toBeCloseTo(0, 0)
    expect(result.b).toBeCloseTo(0, 0)
  })

  it('converts HSB to RGB', () => {
    const result = convertToRgb({ space: 'hsb', h: 0, s: 100, b: 100, alpha: 1 })
    expect(result.space).toBe('rgb')
    expect(result.r).toBeCloseTo(255, 0)
  })
})

describe('convertToHsl', () => {
  it('returns an HSL color unchanged (same reference)', () => {
    const hsl: HSLColor = { space: 'hsl', h: 1, s: 2, l: 3, alpha: 1 }
    expect(convertToHsl(hsl)).toBe(hsl)
  })

  it('converts RGB to HSL', () => {
    const result = convertToHsl({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(result.space).toBe('hsl')
    expect(result.h).toBeCloseTo(0, 0)
    expect(result.s).toBeCloseTo(100, 0)
    expect(result.l).toBeCloseTo(50, 0)
  })

  it('converts HSB to HSL (via RGB)', () => {
    const result = convertToHsl({ space: 'hsb', h: 0, s: 100, b: 100, alpha: 1 })
    expect(result.space).toBe('hsl')
    expect(result.l).toBeCloseTo(50, 0)
  })
})

describe('convertToHsb', () => {
  it('returns an HSB color unchanged (same reference)', () => {
    const hsb: HSBColor = { space: 'hsb', h: 1, s: 2, b: 3, alpha: 1 }
    expect(convertToHsb(hsb)).toBe(hsb)
  })

  it('converts RGB to HSB', () => {
    const result = convertToHsb({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(result.space).toBe('hsb')
    expect(result.s).toBeCloseTo(100, 0)
    expect(result.b).toBeCloseTo(100, 0)
  })

  it('converts HSL to HSB (via RGB)', () => {
    const result = convertToHsb({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })
    expect(result.space).toBe('hsb')
    expect(result.b).toBeCloseTo(100, 0)
  })
})

describe('rgbToHsl', () => {
  it('converts pure red', () => {
    const hsl = rgbToHsl({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(hsl.h).toBeCloseTo(0, 0)
    expect(hsl.s).toBeCloseTo(100, 0)
    expect(hsl.l).toBeCloseTo(50, 0)
  })

  it('treats achromatic gray as saturation 0 (max === min branch)', () => {
    const hsl = rgbToHsl({ space: 'rgb', r: 128, g: 128, b: 128, alpha: 1 })
    expect(hsl.h).toBe(0)
    expect(hsl.s).toBe(0)
    expect(hsl.l).toBeCloseTo(50, 0)
  })

  it('preserves alpha', () => {
    expect(rgbToHsl({ space: 'rgb', r: 0, g: 0, b: 0, alpha: 0.25 }).alpha).toBe(0.25)
  })
})

describe('hslToRgb', () => {
  it('converts pure red', () => {
    const rgb = hslToRgb({ space: 'hsl', h: 0, s: 100, l: 50, alpha: 1 })
    expect(rgb.r).toBeCloseTo(255, 0)
    expect(rgb.g).toBeCloseTo(0, 0)
    expect(rgb.b).toBeCloseTo(0, 0)
  })

  it('treats saturation 0 as achromatic (r === g === b === lightness)', () => {
    const rgb = hslToRgb({ space: 'hsl', h: 180, s: 0, l: 40, alpha: 1 })
    expect(rgb.r).toBe(rgb.g)
    expect(rgb.g).toBe(rgb.b)
    expect(rgb.r).toBeCloseTo(0.4 * 255, 5)
  })

  it('round-trips through rgbToHsl', () => {
    const original: RGBColor = { space: 'rgb', r: 30, g: 200, b: 90, alpha: 1 }
    const roundTripped = hslToRgb(rgbToHsl(original))
    expect(roundTripped.r).toBeCloseTo(original.r, 0)
    expect(roundTripped.g).toBeCloseTo(original.g, 0)
    expect(roundTripped.b).toBeCloseTo(original.b, 0)
  })
})

describe('rgbToHsb', () => {
  it('converts pure red', () => {
    const hsb = rgbToHsb({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(hsb.h).toBeCloseTo(0, 0)
    expect(hsb.s).toBeCloseTo(100, 0)
    expect(hsb.b).toBeCloseTo(100, 0)
  })

  it('treats black as zero saturation without dividing by zero (max === 0 guard)', () => {
    const hsb = rgbToHsb({ space: 'rgb', r: 0, g: 0, b: 0, alpha: 1 })
    expect(hsb.s).toBe(0)
    expect(hsb.b).toBe(0)
    expect(Number.isNaN(hsb.s)).toBe(false)
  })

  it('preserves alpha', () => {
    expect(rgbToHsb({ space: 'rgb', r: 0, g: 0, b: 0, alpha: 0.75 }).alpha).toBe(0.75)
  })
})

describe('hsbToRgb', () => {
  // Sweeps every branch of the internal `i % 6` switch by stepping hue in
  // 60-degree increments through the six primary/secondary colors.
  it('sweeps every 60-degree hue sector', () => {
    const cases: Array<[number, RGBColor]> = [
      [0, { space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 }], // i=0 red
      [60, { space: 'rgb', r: 255, g: 255, b: 0, alpha: 1 }], // i=1 yellow
      [120, { space: 'rgb', r: 0, g: 255, b: 0, alpha: 1 }], // i=2 green
      [180, { space: 'rgb', r: 0, g: 255, b: 255, alpha: 1 }], // i=3 cyan
      [240, { space: 'rgb', r: 0, g: 0, b: 255, alpha: 1 }], // i=4 blue
      [300, { space: 'rgb', r: 255, g: 0, b: 255, alpha: 1 }], // i=5 magenta
    ]
    for (const [h, expected] of cases) {
      const rgb = hsbToRgb({ space: 'hsb', h, s: 100, b: 100, alpha: 1 })
      expect(rgb.r).toBeCloseTo(expected.r, 0)
      expect(rgb.g).toBeCloseTo(expected.g, 0)
      expect(rgb.b).toBeCloseTo(expected.b, 0)
    }
  })

  it('zero saturation yields a gray at the brightness value', () => {
    const rgb = hsbToRgb({ space: 'hsb', h: 0, s: 0, b: 50, alpha: 1 })
    expect(rgb.r).toBeCloseTo(rgb.g, 5)
    expect(rgb.g).toBeCloseTo(rgb.b, 5)
    expect(rgb.r).toBeCloseTo(0.5 * 255, 0)
  })

  it('preserves alpha', () => {
    expect(hsbToRgb({ space: 'hsb', h: 0, s: 0, b: 0, alpha: 0.1 }).alpha).toBe(0.1)
  })

  it('round-trips through rgbToHsb', () => {
    const original: HSBColor = { space: 'hsb', h: 210, s: 40, b: 65, alpha: 1 }
    const roundTripped = rgbToHsb(hsbToRgb(original))
    expect(roundTripped.h).toBeCloseTo(original.h, 0)
    expect(roundTripped.s).toBeCloseTo(original.s, 0)
    expect(roundTripped.b).toBeCloseTo(original.b, 0)
  })
})
