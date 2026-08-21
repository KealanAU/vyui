/**
 * Lynx-native composables — DOM-API replacements for the Lynx background
 * thread. Import as `@/shared/composables`.
 */

export { useResizeObserver } from './useResizeObserver.js'
export type { LayoutRect, LayoutChangeEvent } from './useResizeObserver.js'

export { useElementRect } from './useElementRect.js'

export { useFocus } from './useFocus.js'

export { useDismissableLayer } from './useDismissableLayer.js'
export type { DismissableLayerEmits, DismissableLayerEvent, UseDismissableLayerOptions } from './useDismissableLayer.js'


export { useAnimate } from './useAnimate.js'
export type { SlideDirection } from './useAnimate.js'

export {
  BOUNCE_CONSTANTS,
  BOUNCING_STATUS,
  getBouncingStatus,
  isOverTriggerDistance,
  rubberBandingDistance,
  shouldBounceWhenTouchEnd,
} from './useBounce.js'
// `BounceableBasicProps` / `ScrollToBouncesInfo` / `SingleSidedBounce` are the
// public bounce *prop* types — they are re-exported via the ScrollView barrel
// (their natural home) to keep a single export path and avoid a root-level
// re-export ambiguity. Only the composable-internal `BouncingStatusValue` is
// surfaced here.
export type { BouncingStatusValue } from './useBounce.js'

export { useTouchEmulation } from './useTouchEmulation.js'
export type { UseTouchEmulationOptions, UseTouchEmulationReturn } from './useTouchEmulation.js'

export { useStandardVModel, useStandardVModelOf } from './useStandardVModel.js'

export { useA11y } from './useA11y.js'
export type { A11yDescriptor, A11yProps, A11yRole, A11yTrait } from './useA11y.js'

export {
  getSafeAreaInsets,
  getSafeAreaInsetsFromGlobalProps,
  provideSafeAreaInsets,
  useSafeArea,
} from './useSafeArea.js'
export type { SafeAreaInsets } from './useSafeArea.js'

export { useGlobalEvent } from './useGlobalEvent.js'
export type { UseGlobalEventOptions } from './useGlobalEvent.js'

export { getViewportSize } from './useViewport.js'
export type { ViewportSize } from './useViewport.js'

export {
  directionAxis,
  directionCloseSign,
  pickRelease,
  resolveSnapPositions,
  resolveSnapToPosition,
  viewportSnapsToPositions,
} from './useSheetBehavior.js'
export type {
  PickReleaseOptions,
  PickReleaseResult,
  SheetDirection,
  SheetSnap,
} from './useSheetBehavior.js'
