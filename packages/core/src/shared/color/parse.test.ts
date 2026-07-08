// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { isValidColor, normalizeColor, parseColor } from './parse'

describe('parseColor — hex', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#ff0000')).toEqual({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
    expect(parseColor('#00ff00')).toEqual({ space: 'rgb', r: 0, g: 255, b: 0, alpha: 1 })
  })

  it('parses 3-digit shorthand hex', () => {
    expect(parseColor('#f00')).toEqual({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
  })

  it('parses 8-digit hex with alpha', () => {
    const result = parseColor('#ff000080')
    expect(result.space).toBe('rgb')
    expect((result as any).r).toBe(255)
    expect((result as any).alpha).toBeCloseTo(0.5, 2)
  })

  it('is case-insensitive', () => {
    expect(parseColor('#FF0000')).toEqual(parseColor('#ff0000'))
  })

  it('trims surrounding whitespace', () => {
    expect(parseColor('  #ff0000  ')).toEqual({ space: 'rgb', r: 255, g: 0, b: 0, alpha: 1 })
  })

  it('throws for an invalid hex length', () => {
    expect(() => parseColor('#ff00')).toThrow()
  })

  it('throws for invalid hex characters', () => {
    expect(() => parseColor('#gggggg')).toThrow()
  })
})

describe('parseColor — rgb()/rgba()', () => {
  it('parses rgb()', () => {
    expect(parseColor('rgb(255, 128, 64)')).toEqual({ space: 'rgb', r: 255, g: 128, b: 64, alpha: 1 })
  })

  it('parses rgba() with an explicit alpha', () => {
    expect(parseColor('rgba(255, 128, 64, 0.5)')).toEqual({ space: 'rgb', r: 255, g: 128, b: 64, alpha: 0.5 })
  })

  it('tolerates irregular whitespace', () => {
    expect(parseColor('rgb( 10 ,  20,30 )')).toEqual({ space: 'rgb', r: 10, g: 20, b: 30, alpha: 1 })
  })

  it('throws for a malformed rgb() string', () => {
    expect(() => parseColor('rgb(not, a, color)')).toThrow()
  })
})

describe('parseColor — hsl()/hsla()', () => {
  it('parses hsl()', () => {
    expect(parseColor('hsl(120, 50%, 50%)')).toEqual({ space: 'hsl', h: 120, s: 50, l: 50, alpha: 1 })
  })

  it('parses hsla() with an explicit alpha', () => {
    expect(parseColor('hsla(120, 50%, 50%, 0.5)')).toEqual({ space: 'hsl', h: 120, s: 50, l: 50, alpha: 0.5 })
  })

  it('throws for a malformed hsl() string (missing % signs)', () => {
    expect(() => parseColor('hsl(120, 50, 50)')).toThrow()
  })
})

describe('parseColor — hsb()', () => {
  it('parses hsb() with % signs', () => {
    expect(parseColor('hsb(200, 50%, 75%)')).toEqual({ space: 'hsb', h: 200, s: 50, b: 75, alpha: 1 })
  })

  it('parses hsb() without % signs (optional in the HSB regex)', () => {
    expect(parseColor('hsb(200, 50, 75)')).toEqual({ space: 'hsb', h: 200, s: 50, b: 75, alpha: 1 })
  })

  it('parses hsb() with an explicit alpha', () => {
    expect(parseColor('hsb(200, 50%, 75%, 0.4)')).toEqual({ space: 'hsb', h: 200, s: 50, b: 75, alpha: 0.4 })
  })

  it('parses hsv() as an alias of hsb()', () => {
    expect(parseColor('hsv(200, 50%, 75%)')).toEqual({ space: 'hsb', h: 200, s: 50, b: 75, alpha: 1 })
  })
})

describe('parseColor — unsupported input', () => {
  it('throws for a completely unrecognized string', () => {
    expect(() => parseColor('not a color')).toThrow()
  })

  it('throws for an empty string', () => {
    expect(() => parseColor('')).toThrow()
  })
})

describe('normalizeColor', () => {
  it('parses string colors', () => {
    expect(normalizeColor('#ff0000')).toEqual(parseColor('#ff0000'))
  })

  it('returns Color objects as-is (same reference)', () => {
    const color = { space: 'hsl' as const, h: 120, s: 50, l: 50, alpha: 1 }
    expect(normalizeColor(color)).toBe(color)
  })
})

describe('isValidColor', () => {
  it('returns true for valid hex/rgb/hsl/hsb strings', () => {
    expect(isValidColor('#ff0000')).toBe(true)
    expect(isValidColor('rgb(255, 0, 0)')).toBe(true)
    expect(isValidColor('hsl(0, 100%, 50%)')).toBe(true)
    expect(isValidColor('hsb(0, 100%, 100%)')).toBe(true)
  })

  it('returns false for invalid strings', () => {
    expect(isValidColor('not a color')).toBe(false)
    expect(isValidColor('#gggggg')).toBe(false)
  })

  it('returns true for hsv()', () => {
    expect(isValidColor('hsv(200, 50%, 75%)')).toBe(true)
  })
})
