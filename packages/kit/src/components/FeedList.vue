<script lang="ts">
import { tv } from 'tailwind-variants'
import theme from '../theme/feedList'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.feedList`.
 */
export const buildFeedList = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).feedList as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

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
  scrollBarEnable?: boolean
  /** Disable scrolling and refresh interactions. */
  disabled?: boolean
  /** Controlled refreshing state. Bind with `v-model:refreshing`. */
  refreshing?: boolean
  /** Initial refreshing state when uncontrolled. */
  defaultRefreshing?: boolean
  /** Enable pull-to-refresh. */
  enableRefresh?: boolean
  /** Enable load-more on scroll-to-lower. */
  enableLoadMore?: boolean
  /** Number of items from the bottom that triggers `load-more`. */
  loadMoreThresholdItemCount?: number
  /** Number of items from the top that triggers `scrollToUpper`. */
  upperThresholdItemCount?: number
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildFeedList>['slots'], any>>
}

export interface FeedListSlots<T = unknown> {
  /** Row template. Receives the item and its current index. */
  item?(props: { item: T, index: number }): any
  /** Custom refresh-header content (only used when `enableRefresh`). */
  refreshHeader?(props?: {}): any
  /** Rendered in place of the list when `items` is empty. */
  empty?(props?: {}): any
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed } from 'vue'
import { FeedList as CoreFeedList } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<FeedListProps<T>>(), {})
const emit = defineEmits<{
  'update:refreshing': [value: boolean]
  refresh: []
  loadMore: []
  scrollToLower: [event: unknown]
  scrollToUpper: [event: unknown]
  scroll: [event: unknown]
  scrollStateChange: [event: unknown]
}>()
defineSlots<FeedListSlots<T>>()

const appConfig = useAppConfig()

const ui = computed(() => buildFeedList(appConfig))
const cls = computed(() => ui.value({ class: props.class }))
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
    :scroll-bar-enable="scrollBarEnable"
    :disabled="disabled"
    :refreshing="refreshing"
    :default-refreshing="defaultRefreshing"
    :enable-refresh="enableRefresh"
    :enable-load-more="enableLoadMore"
    :load-more-threshold-item-count="loadMoreThresholdItemCount"
    :upper-threshold-item-count="upperThresholdItemCount"
    :class="cls"
    @update:refreshing="emit('update:refreshing', $event)"
    @refresh="emit('refresh')"
    @load-more="emit('loadMore')"
    @scroll-to-lower="emit('scrollToLower', $event)"
    @scroll-to-upper="emit('scrollToUpper', $event)"
    @scroll="emit('scroll', $event)"
    @scroll-state-change="emit('scrollStateChange', $event)"
  >
    <template #item="{ item, index }">
      <slot name="item" :item="(item as T)" :index="index" />
    </template>
    <template #refreshHeader>
      <slot name="refreshHeader" />
    </template>
    <template #empty>
      <slot name="empty" />
    </template>
  </CoreFeedList>
</template>
