<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Wraps Lynx's native virtualized `<list>` with a generic
     item template slot, custom rubber-band pull-to-refresh, optional
     overscroll bounce, and load-more on scroll-to-lower.

     PULL-TO-REFRESH — why a NativeGesture and not `<refresh>`
     --------------------------------------------------------
     The native `<refresh>` wrapper works but gives no control over the
     header's physics or threshold and crashes on some iOS list configs. To
     own the rubber-band we must out-arbitrate the `<list>`'s native vertical
     scroll gesture (a hand-rolled transform otherwise loses every touch the
     scroller claims). We register a `NativeGesture` on the list element and,
     from its MT callbacks, call `consumeGesture` / `interceptGesture` to take
     ownership while pulling past the top edge, then paint a translateY on a
     wrapper view via `setStyleProperty`. See `REFRESH-PHYSICS.md` and
     `@/shared/gesture/gestureArbitration` for the full reasoning, and the
     vue-lynx gesture-binding caveat (no compiler transform — we install the
     detector ourselves from a worklet).

     WORKLET CONSTRAINTS (project memory)
     ------------------------------------
     - ALL `'main thread'` worklets that drive the gesture are INLINED here,
       INCLUDING the `__SetGestureDetector` install call. A worklet resident in
       a workspace `.ts` (even "pure plumbing") gets bundled into the BG realm
       and crashes the card at load with `__SetAttribute is not defined`. Only
       PURE, worklet-free maths/types are pulled from `physics.ts` and
       `gestureArbitration.ts`.
     - Worklets are backward-reference only — helpers are defined ABOVE callers.
     - BG writes to `MainThreadRef.current` are dropped; config is synced via
       `runOnMainThread` setter worklets. -->
<script lang="ts">
/** Lifecycle of the pull-to-refresh interaction. */
export type FeedListRefreshState = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

export interface FeedListProps<T = unknown> {
  /** Items to render. Each becomes a `<list-item>` with an `item-key`. */
  items: T[]
  /**
   * Field on `T` to use as the unique key per row. Required by Lynx's `<list>`
   * for diffing — duplicate or unstable keys cause rows to recycle wrong.
   * @defaultValue `'id'`
   */
  itemKeyField?: keyof T & string
  /**
   * Alternative to `itemKeyField`: a function returning the key. Wins when
   * both are provided.
   */
  itemKey?: (item: T, index: number) => string
  /**
   * Layout type. `'flow'` and `'waterfall'` require `spanCount > 1`.
   * @defaultValue `'single'`
   */
  listType?: 'single' | 'flow' | 'waterfall'
  /** Columns / rows for `flow` / `waterfall`. */
  spanCount?: number
  /**
   * @defaultValue `'vertical'`
   */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * Native list bounce at the edges.
   * @defaultValue `true`
   */
  bounces?: boolean
  /**
   * Snap each item to a rest position after scrolling (native `<list>`
   * `item-snap`) — e.g. full-screen vertical paging (one item per swipe).
   * `true` snaps each item to the top (`{ factor: 0, offset: 0 }`); pass an
   * object for a custom paging factor/offset. `list-type: 'single'` only.
   * @defaultValue `false`
   */
  itemSnap?: boolean | { factor: number, offset: number }
  /**
   * @defaultValue `true`
   */
  scrollBarEnable?: boolean
  /** Disable scrolling and refresh interactions. */
  disabled?: boolean

  // Pull-to-refresh
  /**
   * Enable the custom rubber-band pull-to-refresh. When off, the list is a
   * bare native `<list>` and no gesture is installed.
   * @defaultValue `false`
   */
  enableRefresh?: boolean
  /** Controlled refreshing state. Bind with `v-model:refreshing`. */
  refreshing?: boolean
  /** Initial refreshing state when uncontrolled. */
  defaultRefreshing?: boolean
  /**
   * Pull distance (px) past which release triggers a refresh.
   * @defaultValue `64`
   */
  refreshThreshold?: number
  /**
   * Rubber-band overscroll bounce at both edges (independent of the native
   * `bounces` prop, which we leave to the native scroller).
   * @defaultValue `false`
   */
  enableBounce?: boolean

  // Load-more
  /** Enable load-more on scroll-to-lower. */
  enableLoadMore?: boolean
  /** Controlled loading-more state. Bind with `v-model:loadingMore`. */
  loadingMore?: boolean
  /** Initial loading-more state when uncontrolled. */
  defaultLoadingMore?: boolean
  /**
   * Number of items from the bottom that triggers `load-more`.
   * @defaultValue `2`
   */
  loadMoreThresholdItemCount?: number
  /**
   * Number of items from the top that triggers `scrollToUpper`.
   * @defaultValue `0`
   */
  upperThresholdItemCount?: number
}

export type FeedListEmits = {
  'update:refreshing': [value: boolean]
  'update:loadingMore': [value: boolean]
  /** Fired once when the pull crosses threshold and the touch is released. */
  refresh: []
  /** Fired on every pull-to-refresh state transition. */
  refreshStateChange: [state: FeedListRefreshState]
  /** Fires when scroll nears the lower edge (within `loadMoreThresholdItemCount`). */
  loadMore: []
  /** Native `bindscrolltolower`. */
  scrollToLower: [event: unknown]
  /** Native `bindscrolltoupper`. */
  scrollToUpper: [event: unknown]
  /** Native `bindscroll`. */
  scroll: [event: unknown]
  /** Native `bindscrollstatechange`. */
  scrollStateChange: [event: unknown]
  /**
   * Native `bindsnap` — fires when `itemSnap` paging settles on an item.
   * `event.detail.position` is the snapped item index.
   */
  snap: [event: unknown]
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed, onMounted, ref, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { useStandardVModelOf } from '@/shared/composables'
// Types/policy/constants only — NO runtime worklet is imported from this module.
// The gesture-install worklet (`__SetGestureDetector`/`__SetAttribute`) is
// inlined in `_installGesture` below: a worklet resident in a workspace `.ts`
// gets bundled to the BG realm and crashes at card load with
// `__SetAttribute is not defined`. See gestureArbitration.ts "WHAT LIVES WHERE".

const props = withDefaults(defineProps<FeedListProps<T>>(), {
  itemKeyField: 'id' as never,
  listType: 'single',
  spanCount: 1,
  scrollOrientation: 'vertical',
  bounces: true,
  scrollBarEnable: true,
  disabled: false,
  enableRefresh: false,
  defaultRefreshing: false,
  refreshThreshold: 64,
  enableBounce: false,
  enableLoadMore: false,
  defaultLoadingMore: false,
  loadMoreThresholdItemCount: 2,
  upperThresholdItemCount: 0,
})

// Mobile-first guidance — see ScrollView.vue for the same note.
if (__DEV__ && props.scrollOrientation === 'horizontal') {
  console.warn(
    '[vyui/FeedList] `scrollOrientation="horizontal"` is a non-default mobile affordance. '
    + 'Touch UX prefers single-axis vertical scroll; consider VyTabs / VySwiper / a paged layout for horizontal flows.',
  )
}

const emits = defineEmits<FeedListEmits>()

defineSlots<{
  /** Row template. Receives the item and its current index. */
  item?: (props: { item: T, index: number }) => any
  /**
   * Pull-to-refresh header. `state` is the current refresh state; `progress`
   * is the pull distance as a fraction of `refreshThreshold` (0..1, clamped).
   */
  refreshHeader?: (props: { state: FeedListRefreshState, progress: number }) => any
  /** Shown at the bottom while `loadingMore` is true. */
  loadMoreFooter?: () => any
  /** Shown at the bottom when there is no more data to load. */
  noMoreDataFooter?: () => any
  /** Rendered in place of the list when `items` is empty. */
  empty?: () => any
}>()

const refreshing = useStandardVModelOf<boolean>(props, 'refreshing', emits)
const loadingMore = useStandardVModelOf<boolean>(props, 'loadingMore', emits)

// --- Refresh state machine (BG) -----------------------------------------
const refreshState = ref<FeedListRefreshState>('idle')
/** Live pull progress (0..1 of threshold), painted into the header slot. */
const pullProgress = ref(0)

function setRefreshState(next: FeedListRefreshState): void {
  if (refreshState.value === next) return
  refreshState.value = next
  emits('refreshStateChange', next)
}

// Native element handles.
const listEl = ref<any>(null)

// --- MT refs (read/written only inside worklets) ------------------------
// The wrapper element we translate to reveal the header.
const wrapperRef = useMainThreadRef<any>(null)
// The list element the gesture is installed on.
const listRef = useMainThreadRef<any>(null)
// Current translateY of the wrapper (px, >= 0 = pulled down).
const offsetRef = useMainThreadRef<number>(0)
const draggingRef = useMainThreadRef<boolean>(false)
const startYRef = useMainThreadRef<number>(0)
const startOffsetRef = useMainThreadRef<number>(0)
const animGenRef = useMainThreadRef<number>(0)

// Config mirrored into MT refs (see header — BG writes to .current are dropped).
const thresholdRef = useMainThreadRef<number>(props.refreshThreshold)
const enableBounceRef = useMainThreadRef<boolean>(props.enableBounce)
const refreshingRef = useMainThreadRef<boolean>(refreshing.value)
const disabledRef = useMainThreadRef<boolean>(props.disabled)
// SDK < 3.3 → use consumeGesture; else interceptGesture. Evaluated on MT.
const useInterceptRef = useMainThreadRef<boolean>(true)

// Stable per-instance gesture id (any unique number works for one detector).
// Declared here (above the worklet callbacks) so they can reference it —
// worklets are backward-reference only.
const GESTURE_ID = Math.floor(Math.random() * 1_000_000) + 1

// --- Worklet helpers (defined ABOVE callers; constraint #2) -------------

/** Paint translateY on the wrapper. */
function _paint(offset: number) {
  'main thread'
  const el = wrapperRef as unknown as {
    current?: { setStyleProperty?: (k: string, v: string) => void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateY(${offset}px)`)
  }
}

/**
 * Rubber-band resistance — mirrors `physics.ts` `rubberEffect` (the
 * unit-tested spec). Output approaches `1.5 * bounceWidth` asymptotically.
 */
function _rubber(delta: number, bounceWidth: number) {
  'main thread'
  if (delta === 0 || bounceWidth === 0) return 0
  const swipeLimit = bounceWidth * 2
  const absDelta = delta < 0 ? -delta : delta
  const effective = absDelta < swipeLimit ? absDelta : swipeLimit
  const bounce = effective / (effective / bounceWidth + 1)
  const sign = delta < 0 ? -1 : 1
  return sign * bounce * 1.5
}

/** Animate the wrapper offset to `to` over `ms`, cubic ease-out. */
function _animateTo(to: number, ms: number) {
  'main thread'
  animGenRef.current = animGenRef.current + 1
  const gen = animGenRef.current
  const from = offsetRef.current
  if (ms <= 0 || from === to) {
    offsetRef.current = to
    _paint(to)
    return
  }
  let startTs = 0
  function step(ts: number) {
    if (gen !== animGenRef.current) return
    if (!startTs) startTs = Number(ts)
    let elapsed = Number(ts) - startTs
    if (elapsed < 0) elapsed = 0
    let progress = elapsed / ms
    if (progress > 1) progress = 1
    const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)
    const value = from + (to - from) * eased
    offsetRef.current = value
    _paint(value)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** Spring the header fully closed and report idle to BG. */
function _springClose() {
  'main thread'
  _animateTo(0, 240)
  runOnBackground(_onClosed as any)()
}

// --- BG → MT config sync (defined AFTER _springClose; constraint #2) -----
function _syncConfig(
  threshold: number,
  enableBounce: boolean,
  disabled: boolean,
  isRefreshing: boolean,
) {
  'main thread'
  thresholdRef.current = threshold
  enableBounceRef.current = enableBounce
  disabledRef.current = disabled
  const wasRefreshing = refreshingRef.current
  refreshingRef.current = isRefreshing
  // Consumer ended the refresh → spring the header closed.
  if (wasRefreshing && !isRefreshing) _springClose()
}

watch(
  [
    () => props.refreshThreshold,
    () => props.enableBounce,
    () => props.disabled,
    refreshing,
  ],
  ([threshold, enableBounce, disabled, isRefreshing]) => {
    if (!props.enableRefresh) return
    runOnMainThread(_syncConfig as any)(threshold, enableBounce, disabled, isRefreshing)
  },
)

// --- Gesture callbacks (inline worklets, registered on the detector) -----

function _onGestureBegin() {
  'main thread'
  if (disabledRef.current) return
  draggingRef.current = true
  startYRef.current = 0
  startOffsetRef.current = offsetRef.current
}

/**
 * Per-frame pull handler. `event.params` carries `deltaY` (native scroll
 * delta), `scrollY`, and `isAtStart` (list is at the top). We only own the
 * gesture while pulling DOWN from the top; otherwise we hand it back to the
 * native scroller so normal scrolling and load-more keep working.
 *
 * IMPORTANT: the engine invokes this with the *internal* state manager, whose
 * arbitration method is `__ConsumeGesture(element, id, { consume, inner })` —
 * NOT the public `interceptGesture`/`consumeGesture` (those only exist on the
 * `wrapCallback` wrapper that gesture-runtime would build for the JSX-prop
 * path, which we don't use). `inner:false` = intercept (SDK ≥ 3.3 takes the
 * gesture from the outer native scroller); `inner:true` = consume (SDK < 3.3).
 */
function _onGestureUpdate(event: any, stateManager: any) {
  'main thread'
  const gestureEl = event.currentTarget.element
  const inner = !useInterceptRef.current
  if (disabledRef.current) {
    if (stateManager.__ConsumeGesture) {
      stateManager.__ConsumeGesture(gestureEl, GESTURE_ID, { consume: false, inner })
    }
    return
  }
  const params = event.params
  const atTop = params.isAtStart === true
  // `startYRef` accumulates total vertical travel since gesture start
  // (`deltaY > 0` = finger moving down). `next` is the raw, pre-rubber offset.
  startYRef.current = startYRef.current + (params.deltaY ?? 0)
  const next = startOffsetRef.current + startYRef.current

  const pullingDown = next > 0
  const shouldOwn = atTop && (pullingDown || offsetRef.current > 0) && !refreshingRef.current

  if (!shouldOwn) {
    // Hand the gesture back to the native scroller.
    if (stateManager.__ConsumeGesture) {
      stateManager.__ConsumeGesture(gestureEl, GESTURE_ID, { consume: false, inner })
    }
    return
  }

  // Own the gesture and paint the rubber-band.
  if (stateManager.__ConsumeGesture) {
    stateManager.__ConsumeGesture(gestureEl, GESTURE_ID, { consume: true, inner })
  }

  const threshold = thresholdRef.current
  // Rubber resistance keyed off the threshold as the natural bounce width.
  const eased = _rubber(next, threshold > 0 ? threshold : 64)
  const offset = eased < 0 ? 0 : eased
  offsetRef.current = offset
  _paint(offset)

  let progress = threshold > 0 ? offset / threshold : 0
  if (progress > 1) progress = 1
  runOnBackground(_onPull as any)(progress, offset >= threshold)
}

function _onGestureEnd() {
  'main thread'
  if (!draggingRef.current) return
  draggingRef.current = false
  if (refreshingRef.current) return
  const threshold = thresholdRef.current
  if (offsetRef.current >= threshold && threshold > 0) {
    // Crossed threshold → hold at threshold, enter refreshing, notify BG.
    _animateTo(threshold, 180)
    runOnBackground(_onTriggerRefresh as any)()
  }
  else {
    // Didn't cross → spring back to rest.
    _animateTo(0, 240)
    runOnBackground(_onRelease as any)()
  }
}

// --- BG callbacks --------------------------------------------------------

function _onPull(progress: number, releaseReady: boolean) {
  pullProgress.value = progress
  if (refreshing.value) return
  setRefreshState(releaseReady ? 'releaseReady' : 'pulling')
}

function _onRelease() {
  pullProgress.value = 0
  if (!refreshing.value) setRefreshState('idle')
}

function _onTriggerRefresh() {
  pullProgress.value = 1
  if (refreshing.value) return
  refreshing.value = true
  setRefreshState('refreshing')
  emits('refresh')
}

function _onClosed() {
  pullProgress.value = 0
  setRefreshState('done')
  setRefreshState('idle')
}

// --- Gesture installation ------------------------------------------------
// vue-lynx has no `main-thread:gesture` transform, so we install the detector
// ourselves from MT once the element refs are registered.
//
// BLOCKED ON UPSTREAM: this registers the detector and the engine DOES fire
// onBegin/onUpdate/onEnd, but the callback worklets are never attached to the
// element on the main thread (native: "TriggerFiberElementWorklet failed since
// worklet_info is empty"). React-Lynx attaches them via the `main-thread:gesture`
// snapshot path (processGestureBackground on BG + processGesture on MT); vue-lynx
// has no equivalent binding, so PTR cannot fire today. The engine is kept ready
// for when vue-lynx ships `:main-thread-gesture` — see
// docs/upstream/vue-lynx-gesture-binding.md.
function _installGesture(callbacks: any) {
  'main thread'
  // Detect SDK to pick consume vs intercept (mirrors lynx-ui useRefresh).
  let sdkLessThan33 = false
  if (typeof SystemInfo !== 'undefined') {
    const v = (SystemInfo.engineVersion ?? SystemInfo.lynxSdkVersion ?? '0.0.0').split('.')
    const packed = Number(v[0] || 0) * 10000 + Number(v[1] || 0) * 100 + Number(v[2] || 0)
    sdkLessThan33 = packed < 30300
  }
  useInterceptRef.current = !sdkLessThan33

  // `listRef.current` is a `@lynx-js/react` worklet `Element` WRAPPER, not the
  // raw fiber: `.setAttribute()` / `.setStyleProperty()` are methods that call
  // the PAPI on the hidden raw `.element`. Passing the wrapper straight to a
  // global element PAPI fails with `FiberSetAttribute param 0 should be
  // RefCounted`. So: use the wrapper's `setAttribute` method, and reach the raw
  // `.element` for `__SetGestureDetector` (which has no wrapper method).
  //
  // Mirrors React-Lynx `processGesture` (runtime/lib/gesture/processGesture.js):
  // mark the element gesture-owning, disable flatten, then register the detector
  // with the inline touch callbacks.
  const el = (listRef as unknown as {
    current?: { element?: unknown, setAttribute?: (k: string, v: unknown) => void }
  }).current
  if (el == null || el.element == null || el.setAttribute == null) return
  el.setAttribute('has-react-gesture', true)
  el.setAttribute('flatten', false)
  // Register the callback worklet ctxs with the JS-function lifecycle manager,
  // exactly like React-Lynx's `onWorkletCtxUpdate` (worklet-runtime/lib/bindings
  // /observers.js) does for every gesture callback. Without this `addRef` the
  // engine may hold the ctxs but never dispatch to them.
  // `callbacks` arrives from the BG thread (see onMounted) so each `.callback`
  // is still a worklet ctx OBJECT carrying its worklet_info. Register each with
  // the JS-function lifecycle manager (like React-Lynx's `onWorkletCtxUpdate`).
  const lcm = (globalThis as any).lynxWorkletImpl?._jsFunctionLifecycleManager
  if (lcm != null && callbacks != null) {
    for (let i = 0; i < callbacks.length; i++) {
      lcm.addRef(callbacks[i].callback._execId, callbacks[i].callback)
    }
  }
  // `globalThis.` (not bare) so the worklet transform treats it as a recognized
  // global rather than a background closure var to capture (which crashed at
  // setup with `__SetGestureDetector is not defined`). The PAPI is global on MT
  // once `enableNewGesture` is on (patches/vue-lynx@0.4.0.patch).
  globalThis.__SetGestureDetector(
    el.element,
    GESTURE_ID,
    7, // GestureTypeInner.NATIVE (inlined literal; bare enum imports are undefined on MT)
    { config: { enabled: true }, callbacks },
    { waitFor: [], simultaneous: [], continueWith: [] },
  )
}

onMounted(() => {
  if (!props.enableRefresh) return
  // Register each gesture-callback worklet ctx on the BACKGROUND thread so the
  // native side gets a runnable worklet — otherwise it logs "TriggerFiberElement
  // Worklet failed since worklet_info is empty" and the callback body never runs.
  // React-Lynx does this in `processGestureBackground` via `registerWorkletCtx`.
  // vue-lynx has no `main-thread:gesture` transform to do it for us, but its
  // `runOnMainThread(fn)` calls `registerWorkletCtx(fn)` as a side effect
  // (assigning `_execId`), so we run each callback through it and discard the
  // returned caller. Mutates the ctx in place, so the same objects below carry
  // the registration into `__SetGestureDetector`.
  runOnMainThread(_onGestureBegin as any)
  runOnMainThread(_onGestureUpdate as any)
  runOnMainThread(_onGestureEnd as any)
  const callbacks = [
    { name: 'onBegin', callback: _onGestureBegin },
    { name: 'onUpdate', callback: _onGestureUpdate },
    { name: 'onEnd', callback: _onGestureEnd },
  ]
  // Defer install so the element-ref + worklet-ctx ops have flushed to MT.
  runOnMainThread(_installGesture as any)(callbacks)
})

// --- Helpers / public API ------------------------------------------------

function keyFor(item: T, index: number): string {
  if (typeof props.itemKey === 'function') return props.itemKey(item, index)
  const field = (props.itemKeyField ?? 'id') as string
  const v = (item as Record<string, unknown>)[field]
  if (v == null) return String(index)
  return String(v)
}

function invoke(el: any, method: string, params: Record<string, unknown> = {}): void {
  if (el == null || typeof el.invoke !== 'function') return
  try {
    const op = el.invoke({ method, params })
    if (op && typeof op.exec === 'function') op.exec()
  }
  catch {
    // Best-effort — UI method may not be available on every platform.
  }
}

/**
 * Scroll the list to a specific index, optionally smooth.
 *
 * Lynx's `scrollToPosition` accepts `itemKey` directly — if both `index` and
 * `itemKey` are passed, `itemKey` wins.
 */
function scrollToIndex(index: number, opts: {
  alignTo?: 'top' | 'bottom' | 'middle'
  offset?: number
  smooth?: boolean
} = {}): void {
  invoke(listEl.value, 'scrollToPosition', { index, ...opts })
}

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
  if (props.enableLoadMore && !props.disabled && !loadingMore.value) {
    emits('loadMore')
  }
}

function onScrollToUpper(event: unknown): void {
  emits('scrollToUpper', event)
}

function onScroll(event: unknown): void {
  emits('scroll', event)
}

function onScrollStateChange(event: unknown): void {
  emits('scrollStateChange', event)
}

function onSnap(event: unknown): void {
  emits('snap', event)
}

// Resolve `itemSnap` to the native `item-snap` object (or undefined → no attr).
// `true` → snap each item to the top, the full-screen paging case.
const itemSnapValue = computed(() => {
  if (!props.itemSnap) return undefined
  return props.itemSnap === true ? { factor: 0, offset: 0 } : props.itemSnap
})

const isEmpty = computed(() => props.items.length === 0)
// Render the footer row whenever load-more is enabled: it shows the
// `loadMoreFooter` slot while loading, else the `noMoreDataFooter` slot.
const hasFooter = computed(() => props.enableLoadMore)

defineExpose({ scrollToIndex, refreshState })
</script>

<template>
  <!-- Empty state — render the dedicated slot in place of the list. -->
  <view
    v-if="isEmpty"
    class="vyui-feed-list vyui-feed-list--empty"
    data-vyui-feed-list-empty
    :style="{ flex: 1 }"
  >
    <slot name="empty" />
  </view>
  <!-- PTR-on: a wrapper view holds the refresh header + the list. The wrapper
       is translated down on pull to reveal the header (which sits above the
       fold via negative margin). The gesture is installed on the inner list
       from `_installGesture`. -->
  <view
    v-else-if="enableRefresh"
    class="vyui-feed-list__ptr"
    data-vyui-feed-list-ptr
    :style="{ height: '100%', overflow: 'hidden' }"
  >
    <view
      :main-thread-ref="wrapperRef"
      class="vyui-feed-list__ptr-wrapper"
      data-vyui-feed-list-ptr-wrapper
      :style="{ height: '100%', position: 'relative' }"
    >
      <!-- Header sits ABOVE the fold (absolutely positioned at top:-threshold so
           it's out of flow and doesn't steal the list's height); the wrapper's
           translateY on pull brings it into view. -->
      <view
        class="vyui-feed-list__refresh-header"
        data-vyui-feed-list-refresh-header
        :style="{ position: 'absolute', top: `-${refreshThreshold}px`, left: '0px', right: '0px', height: `${refreshThreshold}px` }"
      >
        <slot name="refreshHeader" :state="refreshState" :progress="pullProgress" />
      </view>
      <list
        ref="listEl"
        :main-thread-ref="listRef"
        class="vyui-feed-list"
        data-vyui-feed-list
        :style="{ height: '100%' }"
        :scroll-orientation="scrollOrientation"
        :list-type="listType"
        :span-count="spanCount"
        :bounces="bounces"
        :enable-scroll="!disabled"
        :scroll-bar-enable="scrollBarEnable"
        :lower-threshold-item-count="loadMoreThresholdItemCount"
        :upper-threshold-item-count="upperThresholdItemCount"
        v-bind="{ 'item-snap': itemSnapValue }"
        @scroll="onScroll"
        @scrolltolower="onScrollToLower"
        @scrolltoupper="onScrollToUpper"
        @scrollstatechange="onScrollStateChange"
        @snap="onSnap"
      >
        <!-- `item-key` must stay kebab-cased; bind via `v-bind` to avoid
             Vue's template compiler camelizing the attribute. -->
        <list-item
          v-for="(item, index) in items"
          :key="keyFor(item, index)"
          v-bind="{ 'item-key': keyFor(item, index) }"
        >
          <slot name="item" :item="item" :index="index" />
        </list-item>
        <!-- Footer row: load-more spinner or no-more-data marker. -->
        <list-item
          v-if="hasFooter"
          v-bind="{ 'item-key': '__vyui_feed_footer__' }"
          data-vyui-feed-list-footer
        >
          <slot v-if="loadingMore" name="loadMoreFooter" />
          <slot v-else name="noMoreDataFooter" />
        </list-item>
      </list>
    </view>
  </view>
  <!-- PTR-off: bare list, no gesture, no wrapper. -->
  <list
    v-else
    ref="listEl"
    class="vyui-feed-list"
    data-vyui-feed-list
    :scroll-orientation="scrollOrientation"
    :list-type="listType"
    :span-count="spanCount"
    :bounces="bounces"
    :enable-scroll="!disabled"
    :scroll-bar-enable="scrollBarEnable"
    :lower-threshold-item-count="loadMoreThresholdItemCount"
    :upper-threshold-item-count="upperThresholdItemCount"
    v-bind="{ 'item-snap': itemSnapValue }"
    @scroll="onScroll"
    @scrolltolower="onScrollToLower"
    @scrolltoupper="onScrollToUpper"
    @scrollstatechange="onScrollStateChange"
    @snap="onSnap"
  >
    <list-item
      v-for="(item, index) in items"
      :key="keyFor(item, index)"
      v-bind="{ 'item-key': keyFor(item, index) }"
    >
      <slot name="item" :item="item" :index="index" />
    </list-item>
    <list-item
      v-if="hasFooter"
      v-bind="{ 'item-key': '__vyui_feed_footer__' }"
      data-vyui-feed-list-footer
    >
      <slot v-if="loadingMore" name="loadMoreFooter" />
      <slot v-else name="noMoreDataFooter" />
    </list-item>
  </list>
</template>
