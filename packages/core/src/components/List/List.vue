<!-- Thin wrapper around Lynx's native `<list>` element. Mirrors the surface
     of `@lynx-js/lynx-ui-list`: pass `<ListItem>` children (or raw
     `<list-item>` if you need the kebab attrs), bind layout props, and call
     the exposed ref methods to drive scroll.

     Pull-to-refresh, load-more, and `<refresh-header>` composition live in
     `FeedList`. This component is the bare primitive — no refresh wrapper,
     no diff machinery. -->
<script lang="ts">
export interface ListProps {
  /**
   * Single column / grid / waterfall. `flow` and `waterfall` need
   * `spanCount > 1`.
   * @defaultValue `'single'`
   */
  listType?: 'single' | 'flow' | 'waterfall'
  /** Columns (vertical) or rows (horizontal) for `flow` / `waterfall`. */
  spanCount?: number
  /** @defaultValue `'vertical'` */
  scrollOrientation?: 'vertical' | 'horizontal'
  /** @defaultValue `true` */
  bounces?: boolean
  /** @defaultValue `true` */
  enableScroll?: boolean
  /** @defaultValue `true` */
  scrollBarEnable?: boolean
  /** Spacing between rows along the scroll axis (px). */
  mainAxisGap?: number
  /** Spacing between columns / waterfall tracks (px). */
  crossAxisGap?: number
  /** Initial scroll position by item index. */
  initialScrollIndex?: number
  /** Sticky-header offset from the top of the list (px). */
  stickyOffset?: number
  /** How many cells to preload off-screen. */
  preloadBufferCount?: number
  /** Item count from the bottom that triggers `scrolltolower`. */
  lowerThresholdItemCount?: number
  /** Item count from the top that triggers `scrolltoupper`. */
  upperThresholdItemCount?: number
  /** Throttle for the native `scroll` event (ms). @defaultValue `200` */
  scrollEventThrottle?: number
  /**
   * iOS bounces respect a parent ScrollView's gesture chain when `true`.
   * @defaultValue `true`
   */
  iosEnableSimultaneousTouch?: boolean
  /** @defaultValue `true` */
  iosScrollsToTop?: boolean
  /** Override the auto-generated DOM `id` (used for `lynx.createSelectorQuery`). */
  listId?: string
}

export type ListEmits = {
  /** Native `bindscroll`. */
  scroll: [event: unknown]
  /** Native `bindscrolltolower` — fires within `lowerThresholdItemCount`. */
  scrollToLower: [event: unknown]
  /** Native `bindscrolltoupper` — fires within `upperThresholdItemCount`. */
  scrollToUpper: [event: unknown]
  /** Native `bindscrollstatechange` — drag / fling / settle transitions. */
  scrollStateChange: [event: unknown]
  /** Native `bindlayoutcomplete` — fires after a layout pass settles. */
  layoutComplete: [event: unknown]
}

export interface ScrollToOptions {
  /** @defaultValue `'top'` */
  alignTo?: 'top' | 'bottom' | 'middle' | 'none'
  /** Extra offset applied on top of `alignTo`. */
  offset?: number
  /** @defaultValue `false` */
  smooth?: boolean
}
</script>

<script setup lang="ts">
import { ref, useId } from 'vue'
import { runOnMainThread, useMainThreadRef } from 'vue-lynx'

const props = withDefaults(defineProps<ListProps>(), {
  listType: 'single',
  spanCount: 1,
  scrollOrientation: 'vertical',
  bounces: true,
  enableScroll: true,
  scrollBarEnable: true,
  mainAxisGap: 0,
  crossAxisGap: 0,
  preloadBufferCount: 0,
  scrollEventThrottle: 200,
  iosEnableSimultaneousTouch: true,
  iosScrollsToTop: true,
})

// Mobile-first guidance — see ScrollView.vue for the same note.
if (__DEV__ && props.scrollOrientation === 'horizontal') {
  console.warn(
    '[vyui/List] `scrollOrientation="horizontal"` is a non-default mobile affordance. '
    + 'Touch UX prefers single-axis vertical scroll; consider VyTabs / VySwiper / a paged layout for horizontal flows.',
  )
}

const emits = defineEmits<ListEmits>()

defineSlots<{ default?: () => any }>()

const autoId = useId()
const listId = ref(props.listId ?? `vy-list-${autoId}`)
const listEl = ref<any>(null)

function invoke(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // `lynx` is the global selector-query API. On non-Lynx hosts it's
    // absent — bail without throwing so consumers can SSR-render.
    if (!globalThis.lynx?.createSelectorQuery) {
      resolve(undefined)
      return
    }
    globalThis.lynx
      .createSelectorQuery()
      .select(`#${listId.value}`)
      .invoke({
        method,
        params,
        success: (res: unknown) => resolve(res),
        fail: (res: unknown) => reject(res),
      })
      .exec()
  })
}

function scrollTo(index: number, opts: ScrollToOptions = {}): Promise<unknown> {
  return invoke('scrollToPosition', {
    position: index,
    index,
    alignTo: opts.alignTo ?? 'top',
    offset: opts.offset,
    smooth: opts.smooth ?? false,
    useScroller: true,
  })
}

function autoScroll(
  rate: `${number}px` | `${number}rpx` | `${number}ppx` | `${number}rem` | `${number}em` | `${number}vw` | `${number}vh`,
  start: boolean,
  autoStop = false,
): void {
  void invoke('autoScroll', { rate, start, autoStop })
}

function getVisibleCells(): Promise<unknown> {
  return invoke('getVisibleCells')
}

// scrollIntoId (3-step MT pipeline).
// `<list>` is virtualised — off-screen cells aren't rendered, so you can't
// `boundingClientRect` a child by id until its cell exists. The 3-step
// chain is:
//   1. `scrollToPosition(index)` materialises the cell.
//   2. `boundingClientRect` of the child, relative to its `<list-item>`,
//      gives us the child's offset inside the cell.
//   3. `scrollToPosition(index, offset)` nudges the inner offset so the
//      child lands at the requested edge of the viewport.
// All three calls run on the main thread to avoid 3× MT/BG bridge hops on
// the promise chain, and so we can read the MT-tracked list size sync.

const listHeightMT = useMainThreadRef<number>(0)
const listWidthMT = useMainThreadRef<number>(0)

// Handle for the `<list>` itself, rather than re-selecting it by id from the
// worklet. `lynx.querySelector` exists only on the NATIVE main thread —
// web-core's MT `lynx` object has no selector API, so every call threw and took
// the whole worklet down with it (same gap ScrollView documents above its own
// element refs). A `main-thread-ref` is resolved by the runtime on both
// platforms, so steps 1 and 3 below work on web too: web-elements' `<x-list>`
// implements `scrollToPosition` as a real DOM method, which is what
// `__InvokeUIMethod` dispatches to.
const listElMT = useMainThreadRef<any>(null)

// `runOnMainThread` must be called with the LITERAL identifier at the call
// site — SWC's worklet transform pattern-matches on `runOnMainThread(fn)`
// before wrapping `fn` and rewriting to dispatch via the MT runtime. Aliasing
// (`const toMainThread = runOnMainThread`) defeats detection and the worklet
// never registers; the runtime throws `cannot read property 'bind' of
// undefined` on first invoke. Cast each `fn` argument inline instead.

function onListLayoutChangeMT(e: any): void {
  'main thread'
  // bindlayoutchange payload differs across platforms — Android puts the
  // size in `params`, iOS / Harmony put it in `detail`. Either is fine.
  const h = e?.detail?.height ?? e?.params?.height
  const w = e?.detail?.width ?? e?.params?.width
  if (typeof h === 'number') listHeightMT.current = h
  if (typeof w === 'number') listWidthMT.current = w
}

function scrollIntoIdMT(
  listItemId: string,
  targetId: string,
  index: number,
  alignTo: 'top' | 'bottom' | 'middle' | 'none',
  animated: boolean,
  extraOffset: number,
  isVertical: boolean,
): void {
  'main thread'
  const listEl = listElMT.current
  if (!listEl || typeof listEl.invoke !== 'function') return
  // Step 1 — bring the cell into existence by index.
  const step1 = listEl.invoke('scrollToPosition', {
    position: index,
    smooth: animated,
    alignTo: 'top',
    useScroller: true,
  })
  if (!step1) return
  step1.then(() => {
    // Step 2 — measure the target relative to its cell, not the screen.
    //
    // The target is an arbitrary consumer-owned child, so there is no ref for
    // it and the global selector is the only way in. That API is native-only,
    // and web's `boundingClientRect` ignores `relativeTo` regardless, so there
    // is nothing meaningful to measure against there. Skipping leaves the
    // step-1 landing — exactly what `alignTo: 'none'` already produces — and
    // still honours `extraOffset` so a sticky-header nudge survives.
    const g = globalThis as any
    if (typeof g?.lynx?.querySelector !== 'function') {
      if (extraOffset !== 0) {
        void listEl.invoke('scrollToPosition', {
          position: index,
          offset: extraOffset,
          smooth: animated,
          useScroller: true,
          alignTo: 'top',
        })
      }
      return
    }
    const step2 = g.lynx.querySelector(`#${targetId}`)?.invoke('boundingClientRect', {
      relativeTo: listItemId,
    })
    if (!step2) return
    step2.then((rect: {
      top: number
      left: number
      bottom: number
      right: number
      width: number
      height: number
    }) => {
      const upper = isVertical ? rect.top : rect.left
      const lower = isVertical ? rect.bottom : rect.right
      const childSize = isVertical ? rect.height : rect.width
      const listSize = isVertical ? listHeightMT.current : listWidthMT.current
      let offset = 0
      if (alignTo === 'top') {
        offset = upper
      }
      else if (alignTo === 'bottom') {
        offset = lower - listSize
      }
      else if (alignTo === 'middle') {
        offset = upper - (listSize - childSize) / 2
      }
      // alignTo === 'none' → leave offset at 0; user gets the step-1 landing.
      // Step 3 — re-scroll with the corrective offset. Negative because Lynx's
      // `offset` is "how far past `position` to scroll" and we want to *expose*
      // the child, not move it further into the cell.
      void listEl.invoke('scrollToPosition', {
        position: index,
        offset: -offset + extraOffset,
        smooth: animated,
        useScroller: true,
        alignTo: 'top',
      })
    }).catch(() => {})
  }).catch(() => {})
}

/**
 * Scroll until the element with `id` is visible at the requested edge of the
 * viewport. Positional signature mirrors `@lynx-js/lynx-ui-list` 1:1.
 *
 * Caller must supply both ids and the row index because `<list>` is
 * virtualised — see the algorithm note above the MT worklet.
 *
 * @param animated   Smooth-scroll all three steps.
 * @param alignTo    Where to land the target child: `top` | `bottom` | `middle`. `none` skips the corrective step.
 * @param id         Id of the *target child element* inside the cell.
 * @param listItemId Id of the wrapping `<list-item>` — used as the `relativeTo` for the `boundingClientRect` measurement.
 * @param index      Row index of the cell. Required to materialise the cell before measurement.
 * @param offset     Extra px applied on top of the alignment offset. Useful for sticky headers.
 */
function scrollIntoId(
  animated: boolean,
  alignTo: 'top' | 'bottom' | 'middle' | 'none',
  id: string,
  listItemId: string,
  index: number,
  offset = 0,
): void {
  void runOnMainThread(scrollIntoIdMT as any)(
    listItemId,
    id,
    index,
    alignTo,
    animated,
    offset,
    props.scrollOrientation === 'vertical',
  )
}

defineExpose({ scrollTo, scrollIntoId, autoScroll, getVisibleCells, listEl })
</script>

<template>
  <list
    :id="listId"
    ref="listEl"
    class="vyui-list"
    data-vyui-list
    :scroll-orientation="scrollOrientation"
    :list-type="spanCount === 1 ? 'single' : listType"
    :span-count="spanCount"
    :column-count="listType === 'single' ? 1 : spanCount"
    :vertical-orientation="scrollOrientation === 'vertical'"
    :bounces="bounces"
    :enable-scroll="enableScroll"
    :scroll-bar-enable="scrollBarEnable"
    :list-main-axis-gap="mainAxisGap"
    :list-cross-axis-gap="crossAxisGap"
    :sticky-offset="stickyOffset"
    sticky="true"
    :initial-scroll-index="initialScrollIndex"
    :preload-buffer-count="preloadBufferCount"
    :lower-threshold-item-count="lowerThresholdItemCount"
    :upper-threshold-item-count="upperThresholdItemCount"
    :scroll-event-throttle="scrollEventThrottle"
    :ios-enable-simultaneous-touch="iosEnableSimultaneousTouch"
    :ios-scrolls-to-top="iosScrollsToTop"
    @scroll="(e: unknown) => emits('scroll', e)"
    @scrolltolower="(e: unknown) => emits('scrollToLower', e)"
    @scrolltoupper="(e: unknown) => emits('scrollToUpper', e)"
    @scrollstatechange="(e: unknown) => emits('scrollStateChange', e)"
    @layoutcomplete="(e: unknown) => emits('layoutComplete', e)"
    :main-thread-ref="listElMT"
    :main-thread-bindlayoutchange="onListLayoutChangeMT"
  >
    <slot />
  </list>
</template>
