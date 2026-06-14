<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Wraps Lynx's native virtualized `<list>` with a generic
     item template slot and load-more on scroll-to-lower.

     Pull-to-refresh is intentionally NOT implemented here. The reference
     upstream (lynx-family/lynx-ui) does not use the native `<refresh>` /
     `<refresh-header>` elements at all — those are legacy built-in UI classes
     that stock LynxExplorer / the OSS engine do not register (mounting one
     hard-crashes the create-UI pass with `LynxCreateUIException: refresh ui
     not found when create UI`). lynx-ui instead drives PTR with a main-thread
     rubber-band engine built on `@lynx-js/gesture-runtime` gesture
     arbitration, which vyui does not ship. Until that path is available, PTR
     is deferred — see REFRESH-PHYSICS.md for the full reasoning and the
     porting checklist. `loadMore` (native `scrolltolower`) is unaffected and
     matches lynx-ui's approach. -->
<script lang="ts">
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
   * @defaultValue `true`
   */
  bounces?: boolean
  /**
   * @defaultValue `true`
   */
  scrollBarEnable?: boolean
  /** Disable scrolling. */
  disabled?: boolean

  // Load-more
  /** Enable load-more on scroll-to-lower. */
  enableLoadMore?: boolean
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
  /**
   * Controlled "load-more in flight" flag. While true, repeated
   * scroll-to-lower events are suppressed so `loadMore` cannot double-fire.
   * Bind with `v-model:loadingMore` or set imperatively around your fetch.
   */
  loadingMore?: boolean
  /** Initial loadingMore state when uncontrolled. */
  defaultLoadingMore?: boolean
  /**
   * No more data to load. When true, `loadMore` will not fire and the
   * `loadMoreFooter`/`noMoreDataFooter` slots can render an end-of-list state.
   */
  noMoreData?: boolean
  /**
   * Minimum gap (ms) between consecutive `loadMore` emissions, even if the
   * list keeps reporting scroll-to-lower. Belt-and-braces against rapid
   * native re-fires while a fetch is still being kicked off.
   * @defaultValue `400`
   */
  loadMoreDebounceMs?: number
}

export type FeedListEmits = {
  'update:loadingMore': [value: boolean]
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
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed, ref } from 'vue'

import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<FeedListProps<T>>(), {
  itemKeyField: 'id' as never,
  listType: 'single',
  spanCount: 1,
  scrollOrientation: 'vertical',
  bounces: true,
  scrollBarEnable: true,
  disabled: false,
  enableLoadMore: false,
  loadMoreThresholdItemCount: 2,
  upperThresholdItemCount: 0,
  defaultLoadingMore: false,
  noMoreData: false,
  loadMoreDebounceMs: 400,
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
  /** Rendered in place of the list when `items` is empty. */
  empty?: () => any
  /** Footer shown at the bottom while more data can be loaded. */
  loadMoreFooter?: (props: { loading: boolean }) => any
  /** Footer shown at the bottom once `noMoreData` is true. */
  noMoreDataFooter?: () => any
}>()

const loadingMore = useStandardVModelOf<boolean>(props, 'loadingMore', emits)

// Native `<list>` element handle for imperative UI methods (scrollToPosition).
const listEl = ref<any>(null)

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

// --- Load-more debouncing ----------------------------------------------------
let lastLoadMoreAt = 0

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
  if (!props.enableLoadMore || props.disabled) return
  // Suppress while a fetch is in flight, when there's nothing left to load,
  // and within the debounce window — native `scrolltolower` can re-fire
  // rapidly as the user rests at the bottom.
  if (loadingMore.value || props.noMoreData) return
  const now = Date.now()
  if (now - lastLoadMoreAt < Math.max(0, props.loadMoreDebounceMs)) return
  lastLoadMoreAt = now
  loadingMore.value = true
  emits('loadMore')
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

const isEmpty = computed(() => props.items.length === 0)
const showLoadMoreFooter = computed(
  () => props.enableLoadMore && !props.noMoreData,
)

defineExpose({ scrollToIndex })
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
    @scroll="onScroll"
    @scrolltolower="onScrollToLower"
    @scrolltoupper="onScrollToUpper"
    @scrollstatechange="onScrollStateChange"
  >
    <!-- `item-key` must stay kebab-cased; bind via `v-bind` to avoid Vue's
         template compiler camelizing the attribute. -->
    <list-item
      v-for="(item, index) in items"
      :key="keyFor(item, index)"
      v-bind="{ 'item-key': keyFor(item, index) }"
    >
      <slot name="item" :item="item" :index="index" />
    </list-item>
    <!-- Load-more / end-of-list footer. Sticky-bottom affordances that mirror
         lynx-ui's loadMoreFooter / noMoreDataFooter swap. -->
    <list-item
      v-if="showLoadMoreFooter && $slots.loadMoreFooter"
      v-bind="{ 'item-key': '__vyui_load_more_footer' }"
      data-vyui-feed-list-footer
    >
      <slot name="loadMoreFooter" :loading="loadingMore" />
    </list-item>
    <list-item
      v-else-if="enableLoadMore && noMoreData && $slots.noMoreDataFooter"
      v-bind="{ 'item-key': '__vyui_no_more_footer' }"
      data-vyui-feed-list-footer
    >
      <slot name="noMoreDataFooter" />
    </list-item>
  </list>
</template>
