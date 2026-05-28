/**
 * Lynx-native composables — DOM-API replacements for the Lynx background
 * thread. Import as `@/shared/composables`.
 */

export { useResizeObserver } from './useResizeObserver.js'
export type { LayoutRect, LayoutChangeEvent } from './useResizeObserver.js'

export { useElementRect } from './useElementRect.js'

export { useFocus } from './useFocus.js'

export { useScrollTo } from './useScrollTo.js'
export type { ScrollAxis, ScrollOptions } from './useScrollTo.js'

export { useDismissableLayer } from './useDismissableLayer.js'
export type { DismissableLayerEmits, DismissableLayerEvent, UseDismissableLayerOptions } from './useDismissableLayer.js'

export { getDragPoint, isMouseReleased } from './dragGesture.js'
export type { DragPoint } from './dragGesture.js'

export { useAnimate } from './useAnimate.js'
export type { SlideDirection } from './useAnimate.js'

export { useMtSmoke } from './useMtSmoke.js'

export { useTouchEmulation } from './useTouchEmulation.js'
export type { UseTouchEmulationOptions, UseTouchEmulationReturn } from './useTouchEmulation.js'

export { useStandardVModel, useStandardVModelOf } from './useStandardVModel.js'

export {
  directionAxis,
  directionCloseSign,
  pickRelease,
  progressFor,
  resolveSnapPositions,
  resolveSnapToPosition,
  useSheetBehavior,
} from './useSheetBehavior.js'
export type {
  PickReleaseOptions,
  PickReleaseResult,
  SheetDirection,
  SheetSnap,
  UseSheetBehaviorOptions,
  UseSheetBehaviorReturn,
} from './useSheetBehavior.js'
