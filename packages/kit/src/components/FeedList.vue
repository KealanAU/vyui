<script lang="ts">
import theme from '../theme/feedList'
import type { FeedListRefreshState } from '@vyui/core'
import type { ClassValue, ThemeTV } from '../composables/useStyledComponent'

type FeedListTV = ThemeTV<typeof theme>

export interface FeedListProps<T = unknown> {
  /** Items to render. Each becomes a `<list-item>` with an `item-key`. */
  items: T[]
  /** Field on `T` to use as the unique key per row. Defaults to `'id'`. */
  itemKeyField?: keyof T & string
  /** Alternative to `itemKeyField`: a function returning the key. */
  itemKey?: (item: T, index: number) => string
  /** Layout type. `'flow'` and `'waterfall'` require `spanCount > 1`. */
  listType?: 'single' | 'flow' | 'waterfall'
  /** Columns / rows for `flow` / `waterfall`. */
  spanCount?: number
  scrollOrientation?: 'vertical' | 'horizontal'
  bounces?: boolean
  /** Snap each item to a rest position after scrolling (native `item-snap`).
   *  `true` = full-screen paging; pass `{ factor, offset }` to customise.
   *  `listType: 'single'` only. */
  itemSnap?: boolean | { factor: number, offset: number }
  scrollBarEnable?: boolean
  /** Disable scrolling. */
  disabled?: boolean
  /** Enable the custom rubber-band pull-to-refresh (touch worklets). */
  enableRefresh?: boolean
  /** Controlled refreshing state. Bind with `v-model:refreshing`. */
  refreshing?: boolean
  /** Pull distance (px) past which release triggers a refresh. Default 64. */
  refreshThreshold?: number
  /** Rubber-band overscroll bounce at both edges. */
  enableBounce?: boolean
  /** Enable load-more on scroll-to-lower. */
  enableLoadMore?: boolean
  /** Number of items from the bottom that triggers `load-more`. */
  loadMoreThresholdItemCount?: number
  /** Number of items from the top that triggers `scrollToUpper`. */
  upperThresholdItemCount?: number
  /** No more data to load — stops `loadMore` and shows the end-of-list footer. */
  noMoreData?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof FeedListTV['slots'], ClassValue>>
}

export interface FeedListEmits {
  'update:refreshing': [value: boolean]
  /** Fired once when the pull crosses threshold and is released. */
  'refresh': []
  /** Fired on every pull-to-refresh state transition. */
  'refreshStateChange': [state: FeedListRefreshState]
  'loadMore': []
  'scrollToLower': [event: unknown]
  'scrollToUpper': [event: unknown]
  'scroll': [event: unknown]
  'scrollStateChange': [event: unknown]
  /** Native `bindsnap` — `event.detail.position` is the snapped item index. */
  'snap': [event: unknown]
}

export interface FeedListSlots<T = unknown> {
  /** Row template. Receives the item and its current index. */
  item?(props: { item: T, index: number }): any
  /** Pull-to-refresh header. `state` is the lifecycle phase; `progress` is the
   *  pull distance as a fraction of the threshold (0..1). */
  refreshHeader?(props: { state: FeedListRefreshState, progress: number }): any
  /** Rendered in place of the list when `items` is empty. */
  empty?(props?: {}): any
  /** Footer shown at the bottom while more data can be loaded. */
  loadMoreFooter?(props: { loading: boolean }): any
  /** Footer shown at the bottom once `noMoreData` is true. */
  noMoreDataFooter?(props?: {}): any
}
</script>

<script setup lang="ts" generic="T = unknown">
import { FeedList as CoreFeedList } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<FeedListProps<T>>(), {})
const emit = defineEmits<FeedListEmits>()
defineSlots<FeedListSlots<T>>()

const { ui: cls } = useStyledComponent('feedList', theme, () => ({ class: props.class }))
</script>

<template>
  <CoreFeedList
    :items="items"
    :item-key-field="itemKeyField"
    :item-key="itemKey"
    :list-type="listType"
    :span-count="spanCount"
    :scroll-orientation="scrollOrientation"
    :bounces="bounces"
    :item-snap="itemSnap"
    :scroll-bar-enable="scrollBarEnable"
    :disabled="disabled"
    :enable-refresh="enableRefresh"
    :refreshing="refreshing"
    :refresh-threshold="refreshThreshold"
    :enable-bounce="enableBounce"
    :enable-load-more="enableLoadMore"
    :load-more-threshold-item-count="loadMoreThresholdItemCount"
    :upper-threshold-item-count="upperThresholdItemCount"
    :no-more-data="noMoreData"
    :class="cls"
    @update:refreshing="emit('update:refreshing', $event)"
    @refresh="emit('refresh')"
    @refresh-state-change="emit('refreshStateChange', $event)"
    @load-more="emit('loadMore')"
    @scroll-to-lower="emit('scrollToLower', $event)"
    @scroll-to-upper="emit('scrollToUpper', $event)"
    @scroll="emit('scroll', $event)"
    @scroll-state-change="emit('scrollStateChange', $event)"
    @snap="emit('snap', $event)"
  >
    <template #item="{ item, index }">
      <slot name="item" :item="(item as T)" :index="index" />
    </template>
    <template #refreshHeader="{ state, progress }">
      <slot name="refreshHeader" :state="state" :progress="progress" />
    </template>
    <template #empty>
      <slot name="empty" />
    </template>
    <!-- Core only renders this slot while loading, so `loading` is always true
         here; kept in the kit slot contract for convenience. -->
    <template #loadMoreFooter>
      <slot name="loadMoreFooter" :loading="true" />
    </template>
    <template #noMoreDataFooter>
      <slot name="noMoreDataFooter" />
    </template>
  </CoreFeedList>
</template>
