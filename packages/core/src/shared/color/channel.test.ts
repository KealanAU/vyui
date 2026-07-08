// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import type { HSBColor, HSLColor, RGBColor } from './types'
import { describe, expect, it } from 'vitest'
import {
  getChannelName,
  getChannelRange,
  getChannelValue,
  setChannelValue,
  setChannelValues,
} from './channel'

describe('getChannelRange', () => {
  it('returns 0-360 for hue', () => {
    expect(getChannelRange('hue')).toEqual({ min: 0, max: 360, step: 1 })
  })

  it('returns 0-100 for saturation/lightness/brightness/alpha', () => {
    expect(getChannelRange('saturation')).toEqual({ min: 0, max: 100, step: 1 })
    expect(getChannelRange('lightness')).toEqual({ min: 0, max: 100, step: 1 })
    expect(getChannelRange('brightness')).toEqual({ min: 0, max: 100, step: 1 })
    expect(getChannelRange('alpha')).toEqual({ min: 0, max: 100, step: 1 })
  })

  it('returns 0-255 for RGB channels', () => {
    expect(getChannelRange('red')).toEqual({ min: 0, max: 255, step: 1 })
    expect(getChannelRange('green')).toEqual({ min: 0, max: 255, step: 1 })
    expect(getChannelRange('blue')).toEqual({ min: 0, max: 255, step: 1 })
  })

  it('throws for an unknown channel', () => {
    expect(() => getChannelRange('bogus' as any)).toThrow()
  })
})

describe('getChannelName', () => {
  it('returns a display name for every channel', () => {
    expect(getChannelName('red')).toBe('Red')
    expect(getChannelName('green')).toBe('Green')
    expect(getChannelName('blue')).toBe('Blue')
    expect(getChannelName('hue')).toBe('Hue')
    expect(getChannelName('saturation')).toBe('Saturation')
    expect(getChannelName('lightness')).toBe('Lightness')
    expect(getChannelName('brightness')).toBe('Brightness')
    expect(getChannelName('alpha')).toBe('Alpha')
  })

  it('falls back to the raw channel value for an unknown channel', () => {
    expect(getChannelName('bogus' as any)).toBe('bogus')
  })
})

describe('getChannelValue', () => {
  const rgb: RGBColor = { space: 'rgb', r: 100, g: 150, b: 200, alpha: 0.5 }
  const hsl: HSLColor = { space: 'hsl', h: 120, s: 50, l: 40, alpha: 1 }
  const hsb: HSBColor = { space: 'hsb', h: 30, s: 60, b: 70, alpha: 1 }

  it('reads red/green/blue directly from an RGB color', () => {
    expect(getChannelValue(rgb, 'red')).toBe(100)
    expect(getChannelValue(rgb, 'green')).toBe(150)
    expect(getChannelValue(rgb, 'blue')).toBe(200)
  })

  it('converts to RGB to read red/green/blue from a non-RGB color', () => {
    expect(getChannelValue(hsl, 'red')).toBeCloseTo(51, 0)
  })

  it('reads hue directly from an HSL color, converting otherwise', () => {
    expect(getChannelValue(hsl, 'hue')).toBe(120)
    expect(getChannelValue(rgb, 'hue')).toBeCloseTo(210, 0)
  })

  it('reads saturation from its native space (HSL vs HSB) without converting', () => {
    expect(getChannelValue(hsl, 'saturation')).toBe(50)
    expect(getChannelValue(hsb, 'saturation')).toBe(60)
  })

  it('converts to HSL to read saturation from an RGB color', () => {
    expect(getChannelValue(rgb, 'saturation')).toBeGreaterThan(0)
  })

  it('reads lightness directly from an HSL color, converting otherwise', () => {
    expect(getChannelValue(hsl, 'lightness')).toBe(40)
    expect(getChannelValue(rgb, 'lightness')).toBeGreaterThan(0)
  })

  it('reads brightness directly from an HSB color, converting otherwise', () => {
    expect(getChannelValue(hsb, 'brightness')).toBe(70)
    expect(getChannelValue(rgb, 'brightness')).toBeCloseTo(78.4, 0)
  })

  it('returns alpha as a 0-100 percentage', () => {
    expect(getChannelValue(rgb, 'alpha')).toBe(50)
    expect(getChannelValue(hsl, 'alpha')).toBe(100)
  })

  it('throws for an unknown channel', () => {
    expect(() => getChannelValue(rgb, 'bogus' as any)).toThrow()
  })
})

describe('setChannelValue', () => {
  it('sets alpha as a percentage of 0-1', () => {
    const rgb: RGBColor = { space: 'rgb', r: 0, g: 0, b: 0, alpha: 1 }
    const result = setChannelValue(rgb, 'alpha', 50)
    expect(result.alpha).toBe(0.5)
  })

  it('sets an RGB channel and preserves the RGB space', () => {
    const rgb: RGBColor = { space: 'rgb', r: 10, g: 20, b: 30, alpha: 1 }
    const result = setChannelValue(rgb, 'red', 255) as RGBColor
    expect(result.space).toBe('rgb')
    expect(result.r).toBe(255)
    expect(result.g).toBeCloseTo(20, 0)
    expect(result.b).toBeCloseTo(30, 0)
  })

  it('sets an RGB channel on a non-RGB color, preserving the original space', () => {
    const hsl: HSLColor = { space: 'hsl', h: 0, s: 0, l: 50, alpha: 1 }
    const result = setChannelValue(hsl, 'red', 255)
    expect(result.space).toBe('hsl')
  })

  it('sets hue/lightness and preserves the original color space', () => {
    const rgb: RGBColor = { space: 'rgb', r: 128, g: 128, b: 128, alpha: 1 }
    const result = setChannelValue(rgb, 'hue', 180)
    expect(result.space).toBe('rgb')
  })

  it('sets saturation respecting the native space (HSB stays HSB)', () => {
    const hsb: HSBColor = { space: 'hsb', h: 0, s: 0, b: 50, alpha: 1 }
    const result = setChannelValue(hsb, 'saturation', 40) as HSBColor
    expect(result.space).toBe('hsb')
    expect(result.s).toBe(40)
  })

  it('sets saturation respecting the native space (HSL stays HSL)', () => {
    const hsl: HSLColor = { space: 'hsl', h: 0, s: 0, l: 50, alpha: 1 }
    const result = setChannelValue(hsl, 'saturation', 40) as HSLColor
    expect(result.space).toBe('hsl')
    expect(result.s).toBe(40)
  })

  it('sets brightness (HSB-only channel), preserving the original space', () => {
    const rgb: RGBColor = { space: 'rgb', r: 128, g: 0, b: 0, alpha: 1 }
    const result = setChannelValue(rgb, 'brightness', 50)
    expect(result.space).toBe('rgb')
  })

  it('clamps values outside the channel range', () => {
    const hsl: HSLColor = { space: 'hsl', h: 120, s: 50, l: 50, alpha: 1 }
    expect((setChannelValue(hsl, 'hue', 500) as HSLColor).h).toBe(360)
    expect((setChannelValue(hsl, 'hue', -50) as HSLColor).h).toBe(0)
  })

  it('throws for an unknown channel', () => {
    const rgb: RGBColor = { space: 'rgb', r: 0, g: 0, b: 0, alpha: 1 }
    expect(() => setChannelValue(rgb, 'bogus' as any, 10)).toThrow()
  })
})

describe('setChannelValues', () => {
  it('returns the color unchanged for an empty channel list', () => {
    const rgb: RGBColor = { space: 'rgb', r: 1, g: 2, b: 3, alpha: 1 }
    expect(setChannelValues(rgb, [])).toBe(rgb)
  })

  it('delegates to setChannelValue for a single-channel list', () => {
    const rgb: RGBColor = { space: 'rgb', r: 1, g: 2, b: 3, alpha: 1 }
    const result = setChannelValues(rgb, [{ channel: 'red', value: 200 }]) as RGBColor
    expect(result.r).toBe(200)
  })

  it('sets HSB saturation and brightness together without cross-contamination', () => {
    const hsb: HSBColor = { space: 'hsb', h: 0, s: 0, b: 50, alpha: 1 }
    const result = setChannelValues(hsb, [
      { channel: 'saturation', value: 10 },
      { channel: 'brightness', value: 90 },
    ]) as HSBColor
    expect(result.space).toBe('hsb')
    expect(result.s).toBe(10)
    expect(result.b).toBe(90)
  })

  it('promotes an RGB source to HSB when setting saturation + brightness', () => {
    const rgb: RGBColor = { space: 'rgb', r: 128, g: 0, b: 128, alpha: 1 }
    const result = setChannelValues(rgb, [
      { channel: 'saturation', value: 99 },
      { channel: 'brightness', value: 50 },
    ]) as HSBColor
    expect(result.space).toBe('hsb')
    expect(result.s).toBe(99)
    expect(result.b).toBe(50)
  })

  it('sets multiple RGB channels together in RGB space', () => {
    const rgb: RGBColor = { space: 'rgb', r: 0, g: 0, b: 0, alpha: 1 }
    const result = setChannelValues(rgb, [
      { channel: 'red', value: 10 },
      { channel: 'green', value: 20 },
    ]) as RGBColor
    expect(result.space).toBe('rgb')
    expect(result.r).toBe(10)
    expect(result.g).toBe(20)
  })

  it('defaults to HSL space when only hue/saturation are given', () => {
    // No rgb/lightness/brightness channel present, so the working color space
    // defaults to HSL even though the source color started as RGB.
    const rgb: RGBColor = { space: 'rgb', r: 10, g: 20, b: 30, alpha: 1 }
    const result = setChannelValues(rgb, [
      { channel: 'hue', value: 90 },
      { channel: 'saturation', value: 50 },
    ])
    expect(result.space).toBe('hsl')
  })

  it('clamps each channel to its own range', () => {
    const hsl: HSLColor = { space: 'hsl', h: 0, s: 0, l: 0, alpha: 1 }
    const result = setChannelValues(hsl, [
      { channel: 'hue', value: 999 },
      { channel: 'lightness', value: -10 },
    ]) as HSLColor
    expect(result.h).toBe(360)
    expect(result.l).toBe(0)
  })
})
