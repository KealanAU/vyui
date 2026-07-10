/**
 * Framework-agnostic utilities ported from `lynx-family/lynx-ui`'s
 * `lynx-ui-common` package (Apache-2.0). These solve Lynx-specific pain
 * (frame-based delays, MT-safe interpolation, dual-thread logging) that vyui
 * consumers would otherwise re-implement per-component.
 */

export { get, noop } from './common'

export { delayFrames } from './delayFrames'

export {
  type ExtrapolationConfig,
  type ExtrapolationType,
  Extrapolation,
  interpolate,
} from './interpolation'

export { interpolateJS } from './interpolationJS'

export { log, mtsLog } from './log'
