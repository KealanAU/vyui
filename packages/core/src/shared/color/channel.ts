import type { ChannelRange, Color, ColorChannel, ColorSpace, HSBColor, HSLColor, RGBColor } from './types'
import { convertToHsb, convertToHsl, convertToRgb, hsbToRgb, hslToRgb, rgbToHsb, rgbToHsl } from './convert'

/**
 * Gets the range (min, max, step) for a color channel.
 */
export function getChannelRange(channel: ColorChannel): ChannelRange {
  switch (channel) {
    case 'hue':
      return { min: 0, max: 360, step: 1 }
    case 'saturation':
    case 'lightness':
    case 'brightness':
    case 'alpha':
      return { min: 0, max: 100, step: 1 }
    case 'red':
    case 'green':
    case 'blue':
      return { min: 0, max: 255, step: 1 }
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}

/**
 * Gets the display name for a channel.
 */
export function getChannelName(channel: ColorChannel): string {
  const names: Record<ColorChannel, string> = {
    red: 'Red',
    green: 'Green',
    blue: 'Blue',
    hue: 'Hue',
    saturation: 'Saturation',
    lightness: 'Lightness',
    brightness: 'Brightness',
    alpha: 'Alpha',
  }
  return names[channel] ?? channel
}

/**
 * Gets the value of a specific channel from a color.
 * Avoids conversion if the color is already in the target color space.
 */
export function getChannelValue(color: Color, channel: ColorChannel): number {
  switch (channel) {
    case 'red':
      return color.space === 'rgb' ? (color as RGBColor).r : convertToRgb(color).r
    case 'green':
      return color.space === 'rgb' ? (color as RGBColor).g : convertToRgb(color).g
    case 'blue':
      return color.space === 'rgb' ? (color as RGBColor).b : convertToRgb(color).b
    case 'hue':
      return color.space === 'hsl' ? (color as HSLColor).h : convertToHsl(color).h
    case 'saturation':
      if (color.space === 'hsl')
        return (color as HSLColor).s
      if (color.space === 'hsb')
        return (color as HSBColor).s
      return convertToHsl(color).s
    case 'lightness':
      return color.space === 'hsl' ? (color as HSLColor).l : convertToHsl(color).l
    case 'brightness':
      return color.space === 'hsb' ? (color as HSBColor).b : convertToHsb(color).b
    case 'alpha':
      return color.alpha * 100
    default:
      throw new Error(`Unknown channel: ${channel}`)
  }
}

/**
 * Sets a channel value on a color, returning a new color.
 * The returned color maintains the original color space.
 */
export function setChannelValue(color: Color, channel: ColorChannel, value: number): Color {
  const range = getChannelRange(channel)
  const clamped = Math.max(range.min, Math.min(range.max, value))

  // Alpha is handled the same across all spaces
  if (channel === 'alpha') {
    return { ...color, alpha: clamped / 100 } as Color
  }

  // For RGB channels, convert to RGB, set, then convert back
  if (channel === 'red' || channel === 'green' || channel === 'blue') {
    const rgb = convertToRgb(color)
    const newRgb: RGBColor = {
      ...rgb,
      [channel === 'red' ? 'r' : channel === 'green' ? 'g' : 'b']: clamped,
    }
    return convertFromRgb(newRgb, color.space)
  }

  // For HSL channels
  if (channel === 'hue' || channel === 'lightness') {
    const hsl = convertToHsl(color)
    const newHsl: HSLColor = {
      ...hsl,
      [channel === 'hue' ? 'h' : 'l']: clamped,
    }
    return convertFromHsl(newHsl, color.space)
  }

  // For saturation, respect the color's native space (HSB vs HSL)
  if (channel === 'saturation') {
    if (color.space === 'hsb') {
      const hsb = convertToHsb(color)
      const newHsb: HSBColor = { ...hsb, s: clamped }
      return convertFromHsb(newHsb, color.space)
    }
    const hsl = convertToHsl(color)
    const newHsl: HSLColor = { ...hsl, s: clamped }
    return convertFromHsl(newHsl, color.space)
  }

  // For brightness (HSB-only)
  if (channel === 'brightness') {
    const hsb = convertToHsb(color)
    const newHsb: HSBColor = { ...hsb, b: clamped }
    return convertFromHsb(newHsb, color.space)
  }

  throw new Error(`Unknown channel: ${channel}`)
}

/**
 * Sets multiple channel values at once, preserving exact values.
 * Useful when updating 2D color areas where both channels change simultaneously.
 */
export function setChannelValues(
  color: Color,
  channels: Array<{ channel: ColorChannel, value: number }>,
): Color {
  if (channels.length === 0)
    return color
  if (channels.length === 1) {
    return setChannelValue(color, channels[0].channel, channels[0].value)
  }

  // Determine the target color space based on all channels
  const channelNames = channels.map(c => c.channel)
  const hasBrightness = channelNames.includes('brightness')
  const hasLightness = channelNames.includes('lightness')
  const hasRgb = channelNames.some(c => c === 'red' || c === 'green' || c === 'blue')

  let workingColor: Color

  if (hasRgb) {
    workingColor = convertToRgb(color)
  }
  else if (hasBrightness) {
    workingColor = convertToHsb(color)
  }
  else if (hasLightness) {
    workingColor = convertToHsl(color)
  }
  else {
    // Default to HSL for hue/saturation
    workingColor = convertToHsl(color)
  }

  for (const { channel, value } of channels) {
    const range = getChannelRange(channel)
    const clamped = Math.max(range.min, Math.min(range.max, value))

    if (channel === 'alpha') {
      workingColor = { ...workingColor, alpha: clamped / 100 }
    }
    else if (workingColor.space === 'rgb' && (channel === 'red' || channel === 'green' || channel === 'blue')) {
      const key = channel === 'red' ? 'r' : channel === 'green' ? 'g' : 'b'
      workingColor = { ...workingColor, [key]: clamped } as RGBColor
    }
    else if (workingColor.space === 'hsl' && (channel === 'hue' || channel === 'saturation' || channel === 'lightness')) {
      const key = channel === 'hue' ? 'h' : channel === 'saturation' ? 's' : 'l'
      workingColor = { ...workingColor, [key]: clamped } as HSLColor
    }
    else if (workingColor.space === 'hsb' && (channel === 'hue' || channel === 'saturation' || channel === 'brightness')) {
      const key = channel === 'hue' ? 'h' : channel === 'saturation' ? 's' : 'b'
      workingColor = { ...workingColor, [key]: clamped } as HSBColor
    }
  }

  // For color areas, keep the working color space to preserve precision
  // Only convert back if we're in single-channel mode (channels.length === 1)
  // In multi-channel mode (like 2D color area), the working color space is more appropriate
  if (channels.length === 1 && workingColor.space !== color.space) {
    if (color.space === 'rgb')
      return convertToRgb(workingColor)
    if (color.space === 'hsl')
      return convertToHsl(workingColor)
    if (color.space === 'hsb')
      return convertToHsb(workingColor)
  }

  return workingColor
}

/**
 * Converts an RGB color to a specific color space.
 */
function convertFromRgb(rgb: RGBColor, targetSpace: ColorSpace): Color {
  if (targetSpace === 'rgb') {
    return rgb
  }
  if (targetSpace === 'hsl') {
    return rgbToHsl(rgb)
  }
  if (targetSpace === 'hsb') {
    return rgbToHsb(rgb)
  }
  throw new Error(`Unknown color space: ${targetSpace}`)
}

/**
 * Converts an HSL color to a specific color space.
 */
function convertFromHsl(hsl: HSLColor, targetSpace: ColorSpace): Color {
  if (targetSpace === 'hsl') {
    return hsl
  }
  const rgb = hslToRgb(hsl)
  if (targetSpace === 'rgb') {
    return rgb
  }
  if (targetSpace === 'hsb') {
    return rgbToHsb(rgb)
  }
  throw new Error(`Unknown color space: ${targetSpace}`)
}

/**
 * Converts an HSB color to a specific color space.
 */
function convertFromHsb(hsb: HSBColor, targetSpace: ColorSpace): Color {
  if (targetSpace === 'hsb') {
    return hsb
  }
  const rgb = hsbToRgb(hsb)
  if (targetSpace === 'rgb') {
    return rgb
  }
  if (targetSpace === 'hsl') {
    return rgbToHsl(rgb)
  }
  throw new Error(`Unknown color space: ${targetSpace}`)
}
