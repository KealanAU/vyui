<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Apache 2.0 licensed, adapted from lynx-family/lynx-ui (Apache 2.0).
     Wraps Lynx's native `<scroll-view>` for mobile-tier scrolling with a
     custom main-thread bounce/overscroll system ported from
     `packages/lynx-ui-scroll-view` (`hooks/useBounce.tsx`,
     `ScrollViewWithBouncesHook.tsx`, `ScrollViewBasic.tsx`).

     The bounce gesture + animation run entirely on the main thread via
     inline `'main thread'` worklets. They are inlined here (not pulled from
     a composable) because vue-lynx's worklet loader does not register MT
     functions that live in workspace `.ts` modules — only the *pure* maths
     lives in `@/shared/composables/useBounce`. Worklet helpers are defined
     ABOVE their callers: MT worklets become `const`, so a forward
     worklet→worklet reference throws at setup.

     Pull-to-refresh is **not** supported on this component. Lynx's iOS
     runtime does not register a `refresh-header` UI as a child of
     `<scroll-view>` (crashes with `LynxCreateUIException: refresh-header ui
     not found`), and the `<refresh>` wrapper element used by `<list>` is
     not registered as a generic standalone element either. Consumers that
     need virtualized PTR should use `FeedList`. The bounce items below are
     NOT pull-to-refresh — they are overscroll indicators only. -->
<script lang="ts">
import type {
  BounceableBasicProps,
  ScrollToBouncesInfo,
  SingleSidedBounce,
} from '@/shared/composables/useBounce'

export type { BounceableBasicProps, ScrollToBouncesInfo, SingleSidedBounce }

export interface ScrollViewProps {
  /**
   * Scroll direction.
   * @defaultValue `'vertical'`
   */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * Enable native bounce on iOS / Harmony / PC. Ignored when
   * `enableBounces` turns on the custom main-thread bounce.
   * @defaultValue `true`
   */
  bounces?: boolean
  /** Disable scrolling. */
  disabled?: boolean
  /**
   * Distance (px) from the upper edge that fires `scrollToUpper`.
   * @defaultValue `0`
   */
  upperThreshold?: number
  /**
   * Distance (px) from the lower edge that fires `scrollToLower`.
   * @defaultValue `0`
   */
  lowerThreshold?: number
  /** Show the native scroll bar. */
  scrollBarEnable?: boolean
  /**
   * Stable id for the scroll container. Required by the bounce system to
   * select the container / bounce wrappers on the main thread. Auto-generated
   * when omitted.
   */
  id?: string

  // ── Custom main-thread bounce (parity with lynx-ui BounceableBasicProps) ──

  /**
   * Turn on the custom main-thread bounce/overscroll system. When `false`
   * (default) the component is a thin wrapper that only forwards the native
   * `bounces` prop.
   * @defaultValue `false`
   */
  enableBounces?: boolean
  /**
   * Fire `scrollToBounces` when the bounce is reached during a fling, not
   * only during a finger-down drag.
   * @defaultValue `true`
   */
  enableBounceEventInFling?: boolean
  /**
   * Overscroll distance (px) past the upper edge required to fire
   * `scrollToBounces` with `{ direction: 'upper' }`.
   * @defaultValue `0`
   */
  startBounceTriggerDistance?: number
  /**
   * Overscroll distance (px) past the lower edge required to fire
   * `scrollToBounces` with `{ direction: 'lower' }`.
   * @defaultValue `0`
   */
  endBounceTriggerDistance?: number
  /**
   * Allow bouncing even when the content is smaller than the viewport.
   * @defaultValue `true`
   */
  alwaysBouncing?: boolean
  /**
   * Which edge(s) may bounce.
   * @defaultValue `'both'`
   */
  singleSidedBounce?: SingleSidedBounce
  /** Size hint (px) used by the bounce maths before the first layout pass. */
  estimatedHeight?: number
  /** Horizontal size hint (px) used before first layout. */
  estimatedWidth?: number
  /**
   * Mirror horizontal bounce direction for RTL layouts.
   * @defaultValue `false`
   */
  enableRTL?: boolean
  /** Emit verbose bounce diagnostics to the console. */
  debugLog?: boolean
}

export type ScrollViewEmits = {
  /** Native `bindscrolltolower` — fires when content nears the lower edge. */
  scrollToLower: [event: unknown]
  /** Native `bindscrolltoupper` — fires when content nears the upper edge. */
  scrollToUpper: [event: unknown]
  /** Native `bindscroll`. */
  scroll: [event: unknown]
  /** Native `bindscrollend`. */
  scrollEnd: [event: unknown]
  /**
   * Custom bounce — fires once when an overscroll crosses the configured
   * trigger distance (drag, or fling when `enableBounceEventInFling`).
   */
  scrollToBounces: [info: ScrollToBouncesInfo]
}
</script>

<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import { runOnBackground, useMainThreadRef } from 'vue-lynx'

import { BOUNCE_CONSTANTS, BOUNCING_STATUS } from '@/shared/composables'

// NEITHER `runOnBackground` NOR `useMainThreadRef` may be aliased — SWC's
// worklet transform only wraps the literal identifiers at the call site.

const props = withDefaults(defineProps<ScrollViewProps>(), {
  scrollOrientation: 'vertical',
  bounces: true,
  disabled: false,
  upperThreshold: 0,
  lowerThreshold: 0,
  scrollBarEnable: true,
  enableBounces: false,
  enableBounceEventInFling: true,
  startBounceTriggerDistance: 0,
  endBounceTriggerDistance: 0,
  alwaysBouncing: true,
  singleSidedBounce: 'both',
  enableRTL: false,
  debugLog: false,
})

// Mobile-first guidance: touch UX prefers one-axis scroll. `horizontal` stays
// supported (Tabs / Carousel will need it) but is flagged as a non-default
// affordance so callers don't pick it accidentally on phone surfaces.
if (__DEV__ && props.scrollOrientation === 'horizontal') {
  console.warn(
    '[vyui/ScrollView] `scrollOrientation="horizontal"` is a non-default mobile affordance. '
    + 'Touch UX prefers single-axis vertical scroll; consider VyTabs / VySwiper / a paged layout for horizontal flows.',
  )
}

const emits = defineEmits<ScrollViewEmits>()

defineSlots<{
  /** Scrollable content. */
  default?: () => any
  /** Overscroll indicator shown when pulling past the upper edge. */
  upperBounceItem?: () => any
  /** Overscroll indicator shown when pulling past the lower edge. */
  lowerBounceItem?: () => any
}>()

const slots = useSlots()
const hasUpperItem = computed(() => Boolean(slots.upperBounceItem))
const hasLowerItem = computed(() => Boolean(slots.lowerBounceItem))

const autoId = useId()
const containerId = computed(() => props.id ?? `vy-scroll-${autoId}`)
const upperWrapperId = computed(() => `${containerId.value}-upperBounceWrapper`)
const lowerWrapperId = computed(() => `${containerId.value}-lowerBounceWrapper`)

const isVertical = computed(() => props.scrollOrientation === 'vertical')

// `iOSBounces` / `none` / disabled all fall back to the plain native wrapper.
const bounceActive = computed(
  () =>
    props.enableBounces
    && props.singleSidedBounce !== 'none'
    && props.singleSidedBounce !== 'iOSBounces'
    && !props.disabled,
)

// ────────────────────────────────────────────────────────────────────────
// Main-thread bounce state. Mirrors lynx-ui's `useBounce` refs 1:1.
// ────────────────────────────────────────────────────────────────────────

const rubberC = useMainThreadRef(BOUNCE_CONSTANTS.rubberC)
const flingDeceleratingRate = useMainThreadRef(BOUNCE_CONSTANTS.flingDeceleratingRate)
const beta = useMainThreadRef(BOUNCE_CONSTANTS.beta)

const singleSidedBounceRef = useMainThreadRef<SingleSidedBounce>(props.singleSidedBounce)
const enableRTLRef = useMainThreadRef<boolean>(props.enableRTL)
const orientationRef = useMainThreadRef<'vertical' | 'horizontal'>(props.scrollOrientation)
const alwaysBouncingRef = useMainThreadRef<boolean>(props.alwaysBouncing)
const enableBounceEventInFlingRef = useMainThreadRef<boolean>(props.enableBounceEventInFling)
const startBounceTriggerDistanceRef = useMainThreadRef<number>(props.startBounceTriggerDistance)
const endBounceTriggerDistanceRef = useMainThreadRef<number>(props.endBounceTriggerDistance)

// Element handles for the nodes the bounce moves. These are `main-thread-ref`s
// rather than lynx-ui's `lynx.querySelector('#id')`: that API exists only on
// the native main thread — web-core's MT `lynx` object has no `querySelector`,
// so every selector call threw and took the whole bounce worklet with it.
const containerElRef = useMainThreadRef<any>(null)
const upperElRef = useMainThreadRef<any>(null)
const lowerElRef = useMainThreadRef<any>(null)

const startTouch = useMainThreadRef<any>(null)
const prevTouch = useMainThreadRef<any>(null)
const startBouncingTouch = useMainThreadRef<any>(null)
const startTouchBouncingDelta = useMainThreadRef<any>(0)
const bouncingTouchStartPosition = useMainThreadRef<any>(0)

const scrollVelocity = useMainThreadRef<number>(0)
const prevScroll = useMainThreadRef<any>(null)

// Current bounce position { bouncingOffset, velocity, timeStamp }.
const bouncingPositionInfo = useMainThreadRef<any>({})

function readEstimatedHeight(): number {
  const sys: any = (globalThis as any).SystemInfo
  if (sys?.pixelHeight && sys?.pixelRatio) return sys.pixelHeight / sys.pixelRatio
  return 800
}
function readEstimatedWidth(): number {
  const sys: any = (globalThis as any).SystemInfo
  if (sys?.pixelWidth && sys?.pixelRatio) return sys.pixelWidth / sys.pixelRatio
  return 400
}

// Container geometry — estimated until the first layout-change event.
const heightRef = useMainThreadRef<number>(props.estimatedHeight ?? readEstimatedHeight())
const widthRef = useMainThreadRef<number>(props.estimatedWidth ?? readEstimatedWidth())

// Edge flags. Both true ⇒ content shorter than viewport.
const toUpper = useMainThreadRef<boolean>(false)
const toLower = useMainThreadRef<boolean>(false)

// Timestamp of the last real touch. Touch browsers replay a tap as a
// compatibility mousedown/mouseup pair after touchend; the mouse handlers
// ignore events inside this window so a tap doesn't run the bounce twice.
const lastTouchTsRef = useMainThreadRef<number>(0)

// Animation-loop guards.
const touchEndFrameEnableFlag = useMainThreadRef<boolean>(false)
const touchingEndBouncingBackEnableFlag = useMainThreadRef<boolean>(false)
const flingEndWithBouncingEnableFlag = useMainThreadRef<boolean>(false)

// ── BG callback for scrollToBounces. Plain (non-worklet) — runs on BG. ──
function _emitScrollToBounces(info: ScrollToBouncesInfo) {
  if (props.enableBounces) emits('scrollToBounces', info)
}

// ────────────────────────────────────────────────────────────────────────
// MT worklets. Helpers MUST appear above their callers (MT fns are `const`;
// forward worklet→worklet references throw at setup).
// ────────────────────────────────────────────────────────────────────────

function _mtIsVertical() {
  'main thread'
  return orientationRef.current === 'vertical'
}

function _mtThreshold() {
  'main thread'
  const sys: any = (globalThis as any).SystemInfo
  return 1.0 / Number(sys?.pixelRatio ?? 1)
}

function _mtIsAndroid() {
  'main thread'
  const sys: any = (globalThis as any).SystemInfo
  return sys?.platform === 'Android'
}

function _mtNormalizeX(value: number) {
  'main thread'
  return enableRTLRef.current ? -value : value
}

function _mtIsEmpty(obj: any) {
  'main thread'
  return !obj || (typeof obj === 'object' && Object.keys(obj).length === 0)
}

/** Paint one transform onto the container and both bounce wrappers. */
function _mtApplyTransform(transform: string) {
  'main thread'
  containerElRef.current?.setStyleProperty?.('transform', transform)
  upperElRef.current?.setStyleProperty?.('transform', transform)
  lowerElRef.current?.setStyleProperty?.('transform', transform)
}

function _mtEnableScroll(enable: boolean) {
  'main thread'
  // Android keeps firing native scroll during a bounce — disable it there.
  if (_mtIsAndroid()) {
    containerElRef.current?.setAttribute?.('enable-scroll', enable)
  }
}

function _mtClearTouchInfo() {
  'main thread'
  startTouch.current = null
  bouncingTouchStartPosition.current = 0
  prevTouch.current = null
  startBouncingTouch.current = null
  startTouchBouncingDelta.current = 0
}

function _mtRaf(animationFunc: () => void) {
  'main thread'
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(animationFunc)
  } else {
    setTimeout(animationFunc, 8)
  }
}

function _mtGetCurrentDelta(event: any) {
  'main thread'
  if (startTouch.current !== null) {
    if (startBouncingTouch.current === null) {
      return _mtIsVertical()
        ? event.touches[0].pageY - startTouch.current[0].pageY
        : _mtNormalizeX(event.touches[0].pageX - startTouch.current[0].pageX)
    } else {
      return _mtIsVertical()
        ? event.touches[0].pageY - startBouncingTouch.current[0].pageY
        : _mtNormalizeX(
          event.touches[0].pageX - startBouncingTouch.current[0].pageX,
        )
    }
  }
  return 0
}

function _mtGetBouncingStatus() {
  'main thread'
  const currentPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
  if (Boolean(toUpper.current) && Boolean(toLower.current)) {
    return alwaysBouncingRef.current
      ? BOUNCING_STATUS.alwaysBouncing
      : BOUNCING_STATUS.noBouncing
  }
  if (currentPosition > 0) return BOUNCING_STATUS.upperBouncing
  if (currentPosition < 0) return BOUNCING_STATUS.lowerBouncing
  return BOUNCING_STATUS.inScrollingRange
}

function _mtShouldBounceWhenTouchEnd(status: number) {
  'main thread'
  if (
    status === BOUNCING_STATUS.inScrollingRange
    || status === BOUNCING_STATUS.noBouncing
  ) {
    return false
  }
  if (
    status === BOUNCING_STATUS.upperBouncing
    || status === BOUNCING_STATUS.lowerBouncing
  ) {
    return true
  }
  if (status === BOUNCING_STATUS.alwaysBouncing) return alwaysBouncingRef.current
  return false
}

function _mtBouncingSetStyle(offset: number) {
  'main thread'
  if (isNaN(Number(offset))) return

  // Track velocity from offset/time deltas.
  if (_mtIsEmpty(bouncingPositionInfo.current)) {
    bouncingPositionInfo.current = { velocity: 0 }
  } else {
    const timeDiff = Date.now() - (bouncingPositionInfo.current.timeStamp ?? Date.now())
    const offsetDiff = offset - (bouncingPositionInfo.current.bouncingOffset ?? 0)
    if (timeDiff > 0) {
      bouncingPositionInfo.current.velocity = offsetDiff / timeDiff
    }
  }
  bouncingPositionInfo.current.bouncingOffset = offset
  bouncingPositionInfo.current.timeStamp = Date.now()

  // When the bounce settles, resync the touch origin.
  if (offset === 0 && prevTouch.current !== null) {
    startTouch.current = prevTouch.current
    bouncingTouchStartPosition.current = 0
  }

  if (_mtIsVertical()) {
    _mtApplyTransform('translateY(' + offset + 'px)')
  } else {
    const visualOffset = enableRTLRef.current ? -offset : offset
    _mtApplyTransform('translateX(' + visualOffset + 'px)')
  }
}

function _mtTriggerScrollToBounces(isUpper: boolean) {
  'main thread'
  runOnBackground(_emitScrollToBounces as any)({ direction: isUpper ? 'upper' : 'lower' })
}

function _mtIsOverTriggerDistance() {
  'main thread'
  const bouncingTop = bouncingPositionInfo.current?.bouncingOffset ?? 0
  const triggerDistance = bouncingTop > 0
    ? startBounceTriggerDistanceRef.current
    : endBounceTriggerDistanceRef.current
  const delta = Math.abs(bouncingTop) - Math.abs(triggerDistance)
  return delta > _mtThreshold()
}

function _mtRubberEffect(isNegative: number, delta: number) {
  'main thread'
  const scrollViewFrameSize = _mtIsVertical() ? heightRef.current : widthRef.current
  const touchStartPosition = Math.abs(
    Number(
      _mtIsEmpty(startTouchBouncingDelta.current)
        ? bouncingTouchStartPosition.current
        : startTouchBouncingDelta.current,
    ),
  )
  const deltaYForTouchStartPosition =
    (scrollViewFrameSize * touchStartPosition)
      / ((scrollViewFrameSize - touchStartPosition) * rubberC.current) || 0
  const deltaYForNextPosition = bouncingTouchStartPosition.current
    ? deltaYForTouchStartPosition + isNegative * delta
    : isNegative * delta
  const dist = Math.max(
    0,
    (1.0
      - 1.0 / ((deltaYForNextPosition * rubberC.current) / scrollViewFrameSize + 1.0))
      * scrollViewFrameSize,
  )
  _mtBouncingSetStyle(isNegative * dist)
}

function _mtTriggerRubberIfCrossingEdge(event: any) {
  'main thread'
  const delta = _mtGetCurrentDelta(event)

  if (
    toUpper.current === true && delta > 0
    && (singleSidedBounceRef.current === 'both'
      || singleSidedBounceRef.current === 'upper')
  ) {
    _mtEnableScroll(false)
    _mtRubberEffect(delta > 0 ? 1 : -1, delta)
  }
  if (
    toLower.current === true && delta < 0
    && (singleSidedBounceRef.current === 'both'
      || singleSidedBounceRef.current === 'lower')
  ) {
    _mtEnableScroll(false)
    _mtRubberEffect(delta > 0 ? 1 : -1, delta)
  }
  _mtEnableScroll(true)
}

function _mtBouncingBack() {
  'main thread'
  const C1 = bouncingPositionInfo.current?.bouncingOffset ?? 0
  const startTime = Date.now()
  const frame = () => {
    if (Boolean(touchingEndBouncingBackEnableFlag.current) === false) return
    const currentTime = Date.now() - startTime
    const C2 = beta.current * C1
    const easedDistance = (C1 + C2 * (currentTime / 1000))
      * Math.pow(Math.E, -beta.current * (currentTime / 1000))
    _mtBouncingSetStyle(easedDistance)
    if (Math.abs(easedDistance) < _mtThreshold()) {
      _mtBouncingSetStyle(0)
    } else {
      _mtRaf(frame)
    }
  }
  _mtRaf(frame)
  touchingEndBouncingBackEnableFlag.current = true
}

function _mtFlingBounce() {
  'main thread'
  const velocity = scrollVelocity.current
  if (Math.abs(velocity) <= _mtThreshold()) return
  let currentVelocity = velocity
  const startTime = Date.now()
  let sent = false
  const frame = () => {
    if (Boolean(flingEndWithBouncingEnableFlag.current) === false) return
    if (Math.abs(currentVelocity) <= _mtThreshold()) {
      flingEndWithBouncingEnableFlag.current = false
      _mtBouncingBack()
    } else {
      const distance = (currentVelocity
        * (Math.pow(flingDeceleratingRate.current, Date.now() - startTime) - 1))
        / Math.log(flingDeceleratingRate.current)
      _mtBouncingSetStyle(-distance)
      if (!sent && _mtIsOverTriggerDistance()) {
        _mtTriggerScrollToBounces((bouncingPositionInfo.current?.bouncingOffset ?? 0) > 0)
        sent = true
      }
      currentVelocity = velocity
        * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
      if (flingEndWithBouncingEnableFlag.current) _mtRaf(frame)
    }
  }
  _mtRaf(frame)
  flingEndWithBouncingEnableFlag.current = true
}

function _mtTouchStart(event: any) {
  'main thread'
  startTouch.current = event.touches
  bouncingTouchStartPosition.current = bouncingPositionInfo.current?.bouncingOffset ?? 0
  touchEndFrameEnableFlag.current = false
  touchingEndBouncingBackEnableFlag.current = false
  flingEndWithBouncingEnableFlag.current = false
}

function _mtTouchMove(event: any) {
  'main thread'
  prevTouch.current = event.touches
  if (startTouch.current === null) return
  const delta = _mtGetCurrentDelta(event)
  const status = _mtGetBouncingStatus()
  if (status === BOUNCING_STATUS.upperBouncing) {
    _mtEnableScroll(false)
    _mtRubberEffect(1, delta)
  } else if (status === BOUNCING_STATUS.lowerBouncing) {
    _mtEnableScroll(false)
    _mtRubberEffect(-1, delta)
  } else if (status === BOUNCING_STATUS.alwaysBouncing) {
    if (alwaysBouncingRef.current) _mtTriggerRubberIfCrossingEdge(event)
  } else if (status === BOUNCING_STATUS.inScrollingRange) {
    _mtTriggerRubberIfCrossingEdge(event)
  }
}

function _mtTouchEnd() {
  'main thread'
  _mtClearTouchInfo()
  _mtEnableScroll(true)
  if (_mtShouldBounceWhenTouchEnd(_mtGetBouncingStatus())) {
    const startTime = Date.now()
    const dragEndVelocity = bouncingPositionInfo.current?.velocity ?? 0
    const dragEndPosition = bouncingPositionInfo.current?.bouncingOffset ?? 0
    if (_mtIsOverTriggerDistance()) {
      _mtTriggerScrollToBounces((bouncingPositionInfo.current?.bouncingOffset ?? 0) > 0)
    }
    let currentVelocity = dragEndVelocity
    const frame = () => {
      if (Boolean(touchEndFrameEnableFlag.current) === false) return
      if (Math.abs(currentVelocity) <= _mtThreshold()) {
        _mtBouncingBack()
      } else {
        const distance = dragEndPosition
          + (dragEndVelocity
              * (Math.pow(flingDeceleratingRate.current, Date.now() - startTime) - 1))
            / Math.log(flingDeceleratingRate.current)
        _mtBouncingSetStyle(distance)
        currentVelocity = dragEndVelocity
          * Math.pow(flingDeceleratingRate.current, Date.now() - startTime)
        if (touchEndFrameEnableFlag.current) _mtRaf(frame)
      }
    }
    _mtRaf(frame)
    touchEndFrameEnableFlag.current = true
  }
}

/** touchend / touchcancel. Stamps the tap guard; mouseup binds the core. */
function _mtTouchRelease() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _mtTouchEnd()
}

// Desktop web: Lynx web dispatches raw mouse events and never synthesizes
// touch from them, so a touch-only bounce is inert under a cursor. Rather than
// refactor the bounce maths off `event.touches` (it stores and re-reads whole
// touch arrays in five places), the mouse wrappers hand the touch worklets the
// one shape they consume. Coordinates arrive top-level on a mouse event
// (`detail` is the DOM click-count number). No mouseleave binding — it doesn't
// bubble, so per-element delivery is unreliable on the Lynx dispatch path.
function _mtMouseDown(e: { pageX: number, pageY: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would start a phantom drag that
  // the next hover move then "releases".
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  _mtTouchStart({ touches: [{ pageX: e.pageX, pageY: e.pageY }] })
}

function _mtMouseMove(e: { pageX: number, pageY: number, buttons?: number }) {
  'main thread'
  // Only an EXPLICIT buttons value with the primary bit clear counts as
  // released (recovers the mouseup lost outside the <lynx-view>). A missing
  // `buttons` is treated as still-pressed — trackpad/synthetic moves can omit
  // it, and ending on those lets go mid-drag.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) {
    _mtTouchEnd()
    return
  }
  _mtTouchMove({ touches: [{ pageX: e.pageX, pageY: e.pageY }] })
}

function _mtHandleScroll(event: any) {
  'main thread'
  if (prevScroll.current && !_mtIsEmpty(prevScroll.current)) {
    const prev = prevScroll.current
    const timeDuration = Date.now() - prev.timestamp
    if (timeDuration > 0) {
      const deltaY = _mtIsVertical()
        ? event.detail.scrollTop - prev.detail.scrollTop
        : _mtNormalizeX(event.detail.scrollLeft - prev.detail.scrollLeft)
      const velocity = deltaY / timeDuration
      if (Number.isFinite(velocity)) scrollVelocity.current = velocity
    }
  }
  prevScroll.current = {
    timestamp: Date.now(),
    detail: { scrollTop: event.detail.scrollTop, scrollLeft: event.detail.scrollLeft },
  }
}

function _mtLayoutChange(event: any) {
  'main thread'
  heightRef.current = (_mtIsAndroid() ? event.params?.height : event.detail?.height) ?? heightRef.current
  widthRef.current = (_mtIsAndroid() ? event.params?.width : event.detail?.width) ?? widthRef.current
}

function _mtUpperExposure() {
  'main thread'
  toUpper.current = true
  if (
    singleSidedBounceRef.current !== 'upper'
    && singleSidedBounceRef.current !== 'both'
  ) {
    return
  }
  if (prevTouch.current !== null) {
    // Reached the edge during a drag.
    startBouncingTouch.current = prevTouch.current
    startTouchBouncingDelta.current = bouncingPositionInfo.current?.bouncingOffset ?? 0
  } else if (
    enableBounceEventInFlingRef.current
    && Math.abs(scrollVelocity.current) > _mtThreshold()
  ) {
    _mtFlingBounce()
  }
}

function _mtUpperDisexposure() {
  'main thread'
  toUpper.current = false
}

function _mtLowerExposure() {
  'main thread'
  toLower.current = true
  if (
    singleSidedBounceRef.current !== 'lower'
    && singleSidedBounceRef.current !== 'both'
  ) {
    return
  }
  if (prevTouch.current !== null) {
    startBouncingTouch.current = prevTouch.current
    startTouchBouncingDelta.current = bouncingPositionInfo.current?.bouncingOffset ?? 0
  } else if (
    enableBounceEventInFlingRef.current
    && scrollVelocity.current > 0
    && Math.abs(scrollVelocity.current) > _mtThreshold()
  ) {
    _mtFlingBounce()
  }
}

function _mtLowerDisexposure() {
  'main thread'
  toLower.current = false
}

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
}
function onScrollToUpper(event: unknown): void {
  emits('scrollToUpper', event)
}
function onScroll(event: unknown): void {
  emits('scroll', event)
}
function onScrollEnd(event: unknown): void {
  emits('scrollEnd', event)
}

// Native bounce only when the custom MT bounce is OFF. When the custom bounce
// runs it owns the overscroll and disables the native one (matches lynx-ui's
// `bounces={false}` on the inner scroll-view).
const nativeBounces = computed(() => (bounceActive.value ? false : props.bounces))

// Exposure-probe inline style — a 1ppx strip pinned at each edge so Lynx fires
// appear/disappear when the user reaches the top/bottom.
const exposureStyle = computed(() =>
  isVertical.value
    ? 'display:flex; overflow:hidden; height:1ppx; width:100%;'
    : 'display:flex; overflow:hidden; height:100%; width:1ppx;',
)

// Bounce wrappers sit just outside the content edges and move with it.
const upperWrapperStyle = computed(() =>
  isVertical.value
    ? 'position:absolute; bottom:100%; width:100%; height:max-content;'
    : `position:absolute; ${props.enableRTL ? 'left:100%' : 'right:100%'}; height:100%; width:max-content;`,
)
const lowerWrapperStyle = computed(() =>
  isVertical.value
    ? 'position:absolute; top:100%; width:100%; height:max-content;'
    : `position:absolute; ${props.enableRTL ? 'right:100%' : 'left:100%'}; height:100%; width:max-content;`,
)

defineExpose({ id: containerId })
</script>

<template>
  <!-- Bounce active: wrap in a clipping container so overscrolled bounce
       items don't paint outside the scroll viewport. Mirrors lynx-ui's
       `ScrollViewWithBouncesHook`. -->
  <view
    v-if="bounceActive"
    class="vyui-scroll-view-wrapper"
    data-vyui-scroll-view-wrapper
    :style="{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }"
  >
    <scroll-view
      :id="containerId"
      ref="scrollViewEl"
      class="vyui-scroll-view"
      data-vyui-scroll-view
      android-touch-slop="page"
      :style="{ width: '100%', height: '100%' }"
      :scroll-orientation="scrollOrientation"
      :bounces="false"
      :enable-scroll="!disabled"
      :scroll-bar-enable="scrollBarEnable"
      :upper-threshold="upperThreshold"
      :lower-threshold="lowerThreshold"
      :ios-enable-simultaneous-touch="true"
      :main-thread-ref="containerElRef"
      :main-thread-bindtouchstart="_mtTouchStart"
      :main-thread-bindtouchmove="_mtTouchMove"
      :main-thread-bindtouchend="_mtTouchRelease"
      :main-thread-bindtouchcancel="_mtTouchRelease"
      :main-thread-bindmousedown="_mtMouseDown"
      :main-thread-bindmousemove="_mtMouseMove"
      :main-thread-bindmouseup="_mtTouchEnd"
      :main-thread-bindscroll="_mtHandleScroll"
      :main-thread-bindlayoutchange="_mtLayoutChange"
      @scrolltolower="onScrollToLower"
      @scrolltoupper="onScrollToUpper"
      @scroll="onScroll"
      @scrollend="onScrollEnd"
    >
      <!-- Upper exposure probe — fires _mtUpperExposure when top is reached. -->
      <view
        :id="`${containerId}-upperExposureView`"
        :style="exposureStyle"
        :exposure-scene="containerId"
        exposure-id="upperExposureView"
        :main-thread-binduiappear="_mtUpperExposure"
        :main-thread-binduidisappear="_mtUpperDisexposure"
      />
      <slot />
      <!-- Lower exposure probe — fires _mtLowerExposure when bottom is reached. -->
      <view
        :id="`${containerId}-lowerExposureView`"
        :style="exposureStyle"
        :exposure-scene="containerId"
        exposure-id="lowerExposureView"
        :main-thread-binduiappear="_mtLowerExposure"
        :main-thread-binduidisappear="_mtLowerDisexposure"
      />
    </scroll-view>

    <!-- Custom overscroll indicators. Translated in lock-step with content. -->
    <view
      v-if="hasUpperItem"
      :id="upperWrapperId"
      :main-thread-ref="upperElRef"
      :style="upperWrapperStyle"
    >
      <slot name="upperBounceItem" />
    </view>
    <view
      v-if="hasLowerItem"
      :id="lowerWrapperId"
      :main-thread-ref="lowerElRef"
      :style="lowerWrapperStyle"
    >
      <slot name="lowerBounceItem" />
    </view>
  </view>

  <!-- Native / no-bounce path: thin wrapper, unchanged behaviour. -->
  <scroll-view
    v-else
    :id="containerId"
    ref="scrollViewEl"
    class="vyui-scroll-view"
    data-vyui-scroll-view
    android-touch-slop="page"
    :scroll-orientation="scrollOrientation"
    :bounces="nativeBounces"
    :enable-scroll="!disabled"
    :scroll-bar-enable="scrollBarEnable"
    :upper-threshold="upperThreshold"
    :lower-threshold="lowerThreshold"
    @scrolltolower="onScrollToLower"
    @scrolltoupper="onScrollToUpper"
    @scroll="onScroll"
    @scrollend="onScrollEnd"
  >
    <slot />
  </scroll-view>
</template>
