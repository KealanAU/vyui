/**
 * Framework-agnostic utilities ported from `lynx-family/lynx-ui`'s
 * `lynx-ui-common` package (Apache-2.0). These solve Lynx-specific pain
 * (rpx/vw conversion, frame-based delays, event-detail normalisation,
 * SelectorQuery wrapping, version compat checks) that vyui consumers would
 * otherwise re-implement per-component.
 */

export { get, noop } from './common'

export { convertToPx, screenHeight, screenWidth } from './convertToPx'

export { delayFrames } from './delayFrames'

export { type EventDetailWithLayout, getEventDetail } from './getEventDetail'

export {
  type ExtrapolationConfig,
  type ExtrapolationType,
  Extrapolation,
  interpolate,
} from './interpolation'

export { interpolateJS } from './interpolationJS'

export { log, mtsLog } from './log'

export { mainThreadifyEventsMapping } from './mainThreadify'

export { convertOverlayMode, registerOverlayMode } from './popoverUtils'

export {
  type GetRectPromise,
  type NodeRef,
  getRect,
  getRectById,
  getRectByRef,
  getRootRect,
  invoke,
  invokeById,
  invokeByRef,
  InvokeRejectError,
  selectorMT,
  setNativeProps,
  setNativePropsById,
  setNativePropsByRef,
} from './selector'

export {
  lynxSDKVersionStringToNumber,
  mtsLynxSDKVersionStringToNumber,
  mtsNativeLynxSDKVersionLessThan,
  nativeLynxSDKVersionGreaterThan,
  nativeLynxSDKVersionLessThan,
} from './version'
