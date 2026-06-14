<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Wraps Lynx's native virtualized `<list>` with a generic
     item template slot, optional pull-to-refresh, and load-more on
     scroll-to-lower.

     Pull-to-refresh: Lynx's iOS list runtime does not register a
     `refresh-header` UI as a direct child of `<list>` — that combination
     crashes with `LynxCreateUIException: refresh-header ui not found`. The
     supported pattern is to wrap `<list>` in a `<refresh>` element and put
     `<refresh-header>` as a sibling of the list inside that wrapper. The
     `<refresh>` element owns the gesture, the refresh state, and the
     `finishRefresh` / `autoStartRefresh` UI methods. -->
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
  /** Disable scrolling and refresh interactions. */
  disabled?: boolean

  // Pull-to-refresh
  /** Controlled refreshing state. Bind with `v-model:refreshing`. */
  refreshing?: boolean
  /** Initial refreshing state when uncontrolled. */
  defaultRefreshing?: boolean
  /** Enable pull-to-refresh. Renders a `<refresh>` wrapper around the list. */
  enableRefresh?: boolean

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
}

export type FeedListEmits = {
  'update:refreshing': [value: boolean]
  /** Fires when the user pulls past the refresh threshold. */
  refresh: []
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
import { computed, ref, watch } from 'vue'

import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<FeedListProps<T>>(), {
  itemKeyField: 'id' as never,
  listType: 'single',
  spanCount: 1,
  scrollOrientation: 'vertical',
  bounces: true,
  scrollBarEnable: true,
  disabled: false,
  defaultRefreshing: false,
  enableRefresh: false,
  enableLoadMore: false,
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
  /** Custom refresh-header content (only used when `enableRefresh`). */
  refreshHeader?: () => any
  /** Rendered in place of the list when `items` is empty. */
  empty?: () => any
}>()

const refreshing = useStandardVModelOf<boolean>(props, 'refreshing', emits)

// Native element handles. Refresh UI methods live on the `<refresh>` element;
// list UI methods (scrollToPosition) live on `<list>`.
const refreshEl = ref<any>(null)
const listEl = ref<any>(null)

function keyFor(item: T, index: number): string {
  if (typeof props.itemKey === 'function') return props.itemKey(item, index)
  const field = props.itemKeyField as string
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

function startRefresh(): void {
  invoke(refreshEl.value, 'autoStartRefresh')
}

function finishRefresh(): void {
  invoke(refreshEl.value, 'finishRefresh')
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

// When the consumer flips `refreshing` back to false, tell the native refresh
// element to rebound its header.
watch(refreshing, (next, prev) => {
  if (prev && !next) finishRefresh()
})

function onStartRefresh(): void {
  if (props.disabled) return
  if (!refreshing.value) refreshing.value = true
  emits('refresh')
}

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
  if (props.enableLoadMore && !props.disabled) {
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

const isEmpty = computed(() => props.items.length === 0)

defineExpose({ startRefresh, finishRefresh, scrollToIndex })
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
  <!-- PTR-on: wrap list in `<refresh>` so iOS registers the refresh UI. The
       `<refresh-header>` belongs as a sibling of `<list>` inside this
       wrapper — placing it inside `<list>` crashes the create-UI pass. -->
  <refresh
    v-else-if="enableRefresh"
    ref="refreshEl"
    class="vyui-feed-list__refresh"
    :enable-refresh="!disabled"
    @startrefresh="onStartRefresh"
  >
    <refresh-header class="vyui-feed-list__refresh-header">
      <slot name="refreshHeader" />
    </refresh-header>
    <list
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
      <!-- `item-key` must stay kebab-cased; bind via `v-bind` to avoid
           Vue's template compiler camelizing the attribute. -->
      <list-item
        v-for="(item, index) in items"
        :key="keyFor(item, index)"
        v-bind="{ 'item-key': keyFor(item, index) }"
      >
        <slot name="item" :item="item" :index="index" />
      </list-item>
    </list>
  </refresh>
  <!-- PTR-off: bare list, no refresh wrapper. -->
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
    <list-item
      v-for="(item, index) in items"
      :key="keyFor(item, index)"
      v-bind="{ 'item-key': keyFor(item, index) }"
    >
      <slot name="item" :item="item" :index="index" />
    </list-item>
  </list>
</template>
