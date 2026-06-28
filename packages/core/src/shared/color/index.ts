export { getChannelName, getChannelRange, getChannelValue, setChannelValue, setChannelValues } from './channel'

export {
  colorToHex,
  colorToHsb,
  colorToHsl,
  colorToRgb,
  colorToString,
  convertToHsb,
  convertToHsl,
  convertToRgb,
} from './convert'

export { getAreaBackgroundStyle, getAreaGradient, getSliderBackgroundStyle, getSliderGradient } from './gradient'

export { isValidColor, normalizeColor, parseColor } from './parse'

export type {
  ChannelRange,
  Color,
  ColorChannel,
  ColorFormat,
  ColorSpace,
  HSBColor,
  HSLColor,
  RGBColor,
} from './types'

// Legacy utilities (keeping for backwards compatibility)
export { getColorContrast, getColorName, hexToHSL, hexToRGB } from './utils'
