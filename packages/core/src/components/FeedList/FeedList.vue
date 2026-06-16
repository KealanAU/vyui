<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Wraps Lynx's native virtualized `<list>` with an item template, rubber-band
     pull-to-refresh, and load-more on scroll-to-lower.

     PTR rides `:main-thread-bindtouch*` worklets. We track the scroll offset
     and only take the gesture over while pulling down from the top edge — at
     `scrollTop 0` with the list's native `bounces` off, nothing competes for
     the touch.
     Rationale + device-verify checklist: REFRESH-PHYSICS.md.

     Worklet rules: every `'main thread'` fn is inlined here (a `.ts`-resident
     worklet crashes the card at load) and defined before its callers
     (backward-reference only); BG writes to `.current` are dropped, so config is
     pushed via `runOnMainThread` setters. -->
<script lang="ts">
/** Lifecycle of the pull-to-refresh interaction. */
export type FeedListRefreshState = 'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'

export interface FeedListProps<T = unknown> {
  /** Items to render. Each becomes a `<list-item>` with an `item-key`. */
  items: T[]
  /**
   * Field on `T` used as the unique key per row. Required by Lynx's `<list>`
   * for diffing — unstable keys recycle rows wrong. The native diff appends /
   * removes by key but does NOT reorder, so when the data order changes (e.g. a
   * refresh) replace the keys rather than permuting existing ones.
   * @defaultValue `'id'`
   */
  itemKeyField?: keyof T & string
  /** Alternative to `itemKeyField`: a function returning the key. Wins if both set. */
  itemKey?: (item: T, index: number) => string
  /**
   * Layout type. `'flow'` / `'waterfall'` require `spanCount > 1`.
   * @defaultValue `'single'`
   */
  listType?: 'single' | 'flow' | 'waterfall'
  /** Columns / rows for `flow` / `waterfall`. */
  spanCount?: number
  /** @defaultValue `'vertical'` */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * Native list bounce at the edges (ignored on the PTR list, which forces it
   * off so the top-edge pull isn't stolen).
   * @defaultValue `true`
   */
  bounces?: boolean
  /**
   * Native `<list>` `item-snap` paging. `true` snaps each item to the top
   * (`{ factor: 0, offset: 0 }`, full-screen paging); pass an object for a
   * custom factor/offset. `listType: 'single'` only.
   * @defaultValue `false`
   */
  itemSnap?: boolean | { factor: number, offset: number }
  /** @defaultValue `true` */
  scrollBarEnable?: boolean
  /** Disable scrolling and refresh interactions. */
  disabled?: boolean

  // Pull-to-refresh
  /**
   * Enable the rubber-band pull-to-refresh. Off → a bare `<list>`, no touch
   * handlers.
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
   * Rubber-band overscroll bounce at both edges that springs back on release.
   * Independent of `enableRefresh`: enable it alone for a bounce-only list, or
   * alongside refresh to add a bottom-edge bounce (the top edge already bounces
   * while pulling to refresh).
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
   * Items from the bottom that triggers `load-more`.
   * @defaultValue `2`
   */
  loadMoreThresholdItemCount?: number
  /**
   * Items from the top that triggers `scrollToUpper`.
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
  /** Native `bindsnap` — `event.detail.position` is the snapped item index. */
  snap: [event: unknown]
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed, ref, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { useStandardVModelOf } from '@/shared/composables'

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
   * Pull-to-refresh header. `state` is the current refresh state; `progress` is
   * the pull distance as a fraction of `refreshThreshold` (0..1, clamped).
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

// Refresh state machine (BG).
const refreshState = ref<FeedListRefreshState>('idle')
/** Live pull progress (0..1 of threshold), painted into the header slot. */
const pullProgress = ref(0)

function setRefreshState(next: FeedListRefreshState): void {
  if (refreshState.value === next) return
  refreshState.value = next
  emits('refreshStateChange', next)
}

const listEl = ref<any>(null)

// MT refs (read/written only inside worklets).
const wrapperRef = useMainThreadRef<any>(null)
const listRef = useMainThreadRef<any>(null)
const offsetRef = useMainThreadRef<number>(0)
const draggingRef = useMainThreadRef<boolean>(false)
/** We've taken the gesture over from the native scroller. */
const owningRef = useMainThreadRef<boolean>(false)
const startYRef = useMainThreadRef<number>(0)
const startOffsetRef = useMainThreadRef<number>(0)
/** Latest list scroll offset (from `:main-thread-bindscroll`) — gates ownership. */
const scrollTopRef = useMainThreadRef<number>(0)
/**
 * Whether the list is at the top edge. Driven by the `scrolltoupper` edge event
 * (reliable) rather than the raw scroll value: with item-snap the final settle
 * frame can report a small non-zero `scrollTop`, leaving the raw value stale.
 */
const atTopRef = useMainThreadRef<boolean>(true)
/** Viewport + content heights, for bottom-edge detection. */
const viewportRef = useMainThreadRef<number>(0)
const contentRef = useMainThreadRef<number>(0)
const animGenRef = useMainThreadRef<number>(0)

const thresholdRef = useMainThreadRef<number>(props.refreshThreshold)
const refreshingRef = useMainThreadRef<boolean>(refreshing.value)
const disabledRef = useMainThreadRef<boolean>(props.disabled)
const refreshEnabledRef = useMainThreadRef<boolean>(props.enableRefresh)
const bounceEnabledRef = useMainThreadRef<boolean>(props.enableBounce)

function _mtIsAndroid() {
  'main thread'
  const sys: any = (globalThis as any).SystemInfo
  return sys?.platform === 'Android'
}

/** Toggle native scroll while we own the pull. Android only — iOS at the top
 *  with bounces off doesn't claim the gesture; Android's edge effect does. */
function _setListScroll(enable: boolean) {
  'main thread'
  if (!_mtIsAndroid()) return
  const el = (listRef as unknown as {
    current?: { setAttribute?: (k: string, v: unknown) => void }
  }).current
  if (el?.setAttribute) el.setAttribute('enable-scroll', enable)
}

function _paint(offset: number) {
  'main thread'
  const el = wrapperRef as unknown as {
    current?: { setStyleProperty?: (k: string, v: string) => void }
  }
  if (el.current?.setStyleProperty) {
    el.current.setStyleProperty('transform', `translateY(${offset}px)`)
  }
}

/** Rubber-band resistance — mirrors `physics.ts` `rubberEffect` (unit-tested). */
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
    offsetRef.current = from + (to - from) * eased
    _paint(offsetRef.current)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

function _springClose() {
  'main thread'
  _animateTo(0, 240)
  runOnBackground(_onClosed as any)()
}

function _syncConfig(
  threshold: number,
  disabled: boolean,
  isRefreshing: boolean,
  refreshEnabled: boolean,
  bounceEnabled: boolean,
) {
  'main thread'
  thresholdRef.current = threshold
  disabledRef.current = disabled
  refreshEnabledRef.current = refreshEnabled
  bounceEnabledRef.current = bounceEnabled
  const wasRefreshing = refreshingRef.current
  refreshingRef.current = isRefreshing
  // Consumer ended the refresh → spring the header closed.
  if (wasRefreshing && !isRefreshing) _springClose()
}

watch(
  [() => props.refreshThreshold, () => props.disabled, refreshing, () => props.enableRefresh, () => props.enableBounce],
  ([threshold, disabled, isRefreshing, refreshEnabled, bounceEnabled]) => {
    if (!props.enableRefresh && !props.enableBounce) return
    runOnMainThread(_syncConfig as any)(threshold, disabled, isRefreshing, refreshEnabled, bounceEnabled)
  },
)

/** Track scroll offset + content height. Detail is `.detail` (iOS) / `.params` (Android). */
function _onScrollMT(event: any) {
  'main thread'
  const d = event.detail ?? event.params
  if (d && typeof d.scrollTop === 'number') {
    scrollTopRef.current = d.scrollTop
    if (d.scrollTop <= 0) atTopRef.current = true
    else if (d.scrollTop > 2) atTopRef.current = false
  }
  if (d && typeof d.scrollHeight === 'number') contentRef.current = d.scrollHeight
}

/** `scrolltoupper` — the reliable "back at the top" signal (see `atTopRef`). */
function _onReachTop() {
  'main thread'
  atTopRef.current = true
  scrollTopRef.current = 0
}

function _onLayoutMT(event: any) {
  'main thread'
  const d = event.detail ?? event.params
  if (d && typeof d.height === 'number') viewportRef.current = d.height
}

function _onTouchStart(event: any) {
  'main thread'
  if (disabledRef.current || refreshingRef.current) return
  draggingRef.current = true
  owningRef.current = false
  startYRef.current = event.touches[0].pageY
  startOffsetRef.current = offsetRef.current
}

function _onTouchMove(event: any) {
  'main thread'
  if (!draggingRef.current || refreshingRef.current) return
  const y = event.touches[0].pageY
  const delta = y - startYRef.current

  // Own the pull at an edge we can react to: the top (refresh or bounce), or
  // the bottom (bounce only). `offset` carries the sign — +down / -up.
  const atTop = atTopRef.current
  const atBottom = viewportRef.current > 0 && contentRef.current > 0
    && scrollTopRef.current + viewportRef.current >= contentRef.current - 1
  const canTop = atTop && (refreshEnabledRef.current || bounceEnabledRef.current)
    && (delta > 0 || offsetRef.current > 0)
  const canBottom = atBottom && bounceEnabledRef.current
    && (delta < 0 || offsetRef.current < 0)

  if (!canTop && !canBottom) {
    if (owningRef.current) {
      owningRef.current = false
      offsetRef.current = 0
      _paint(0)
      _setListScroll(true)
    }
    return
  }

  if (!owningRef.current) {
    // Take over: stop native scroll and re-base the origin so there's no jump.
    owningRef.current = true
    startYRef.current = y
    startOffsetRef.current = 0
    _setListScroll(false)
  }

  const threshold = thresholdRef.current > 0 ? thresholdRef.current : 64
  const offset = _rubber(startOffsetRef.current + (y - startYRef.current), threshold)
  offsetRef.current = offset
  _paint(offset)

  // Only drive the refresh state machine on a downward (top) pull.
  if (refreshEnabledRef.current && offset > 0) {
    let progress = offset / threshold
    if (progress > 1) progress = 1
    runOnBackground(_onPull as any)(progress, offset >= threshold)
  }
}

function _onTouchEnd() {
  'main thread'
  if (!draggingRef.current) return
  draggingRef.current = false
  _setListScroll(true)
  if (!owningRef.current) return
  owningRef.current = false
  if (refreshingRef.current) return
  const threshold = thresholdRef.current
  if (refreshEnabledRef.current && offsetRef.current >= threshold && threshold > 0) {
    _animateTo(threshold, 180)
    runOnBackground(_onTriggerRefresh as any)()
  }
  else {
    // Below threshold or a bounce — spring back to rest.
    _animateTo(0, 240)
    runOnBackground(_onRelease as any)()
  }
}

// BG callbacks.

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

// Helpers / public API.

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

/** Scroll to an item index. `scrollToPosition` also accepts `itemKey` (wins). */
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

// `true` → snap each item to the top (full-screen paging); undefined → no attr.
const itemSnapValue = computed(() => {
  if (!props.itemSnap) return undefined
  return props.itemSnap === true ? { factor: 0, offset: 0 } : props.itemSnap
})

const isEmpty = computed(() => props.items.length === 0)
const hasFooter = computed(() => props.enableLoadMore)

defineExpose({ scrollToIndex, refreshState })
</script>

<template>
  <view
    v-if="isEmpty"
    class="vyui-feed-list vyui-feed-list--empty"
    data-vyui-feed-list-empty
    :style="{ flex: 1 }"
  >
    <slot name="empty" />
  </view>
  <!-- PTR / bounce on: the wrapper is translated on pull (down to reveal the
       refresh header, up to bounce the bottom). Native `bounces` is forced OFF
       so the edge pull isn't stolen by the scroller (see header). -->
  <view
    v-else-if="enableRefresh || enableBounce"
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
      <view
        v-if="enableRefresh"
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
        :bounces="false"
        :enable-scroll="!disabled"
        :scroll-bar-enable="scrollBarEnable"
        :lower-threshold-item-count="loadMoreThresholdItemCount"
        :upper-threshold-item-count="upperThresholdItemCount"
        v-bind="{ 'item-snap': itemSnapValue }"
        :main-thread-bindtouchstart="_onTouchStart"
        :main-thread-bindtouchmove="_onTouchMove"
        :main-thread-bindtouchend="_onTouchEnd"
        :main-thread-bindtouchcancel="_onTouchEnd"
        :main-thread-bindscroll="_onScrollMT"
        :main-thread-bindscrolltoupper="_onReachTop"
        :main-thread-bindlayoutchange="_onLayoutMT"
        @scroll="onScroll"
        @scrolltolower="onScrollToLower"
        @scrolltoupper="onScrollToUpper"
        @scrollstatechange="onScrollStateChange"
        @snap="onSnap"
      >
        <!-- `item-key` stays kebab-cased via `v-bind` (avoids Vue camelizing it). -->
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
    </view>
  </view>
  <!-- PTR-off: bare list, no touch handlers. -->
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
