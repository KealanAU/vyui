<script setup lang="ts">
import type { FeedListRefreshState } from '..'
import { ref } from 'vue'

import { FeedList } from '..'

const items = ref<Array<{ id: string, label: string }>>(
  Array.from({ length: 30 }, (_, i) => ({ id: `r-${i}`, label: `Row ${i + 1}` })),
)
const refreshing = ref(false)
const loadingMore = ref(false)
const noMoreData = ref(false)
const refreshStateLabel = ref<FeedListRefreshState>('idle')

function onRefresh() {
  refreshing.value = true
  setTimeout(() => {
    items.value = items.value.map(it => ({ ...it, label: `${it.label} (refreshed)` }))
    refreshing.value = false
  }, 600)
}

function onLoadMore() {
  // `loadingMore` is owned by FeedList via v-model:loadingMore, so the
  // component already debounces and suppresses re-fires while a fetch is in
  // flight. We just clear it when the fetch resolves.
  setTimeout(() => {
    const start = items.value.length
    if (start >= 60) {
      noMoreData.value = true
      loadingMore.value = false
      return
    }
    items.value = [
      ...items.value,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `r-${start + i}`,
        label: `Row ${start + i + 1}`,
      })),
    ]
    loadingMore.value = false
  }, 600)
}

function onRefreshStateChange(s: FeedListRefreshState) {
  refreshStateLabel.value = s
}
</script>

<template>
  <view data-vyui-feed-list-story>
    <FeedList
      v-model:refreshing="refreshing"
      v-model:loading-more="loadingMore"
      :items="items"
      :no-more-data="noMoreData"
      enable-refresh
      enable-load-more
      data-testid="feed-list"
      @refresh="onRefresh"
      @load-more="onLoadMore"
      @refresh-state-change="onRefreshStateChange"
    >
      <template #item="{ item, index }">
        <view
          :data-testid="`row-${item.id}`"
          :style="{
            height: '56px',
            paddingLeft: '16px',
            display: 'flex',
            alignItems: 'center',
            borderBottomWidth: '1px',
            borderBottomColor: '#eee',
          }"
        >
          <text>{{ item.label }} (#{{ index }})</text>
        </view>
      </template>
      <!-- Header swaps copy per lifecycle state, mirroring lynx-ui's
           pull / release / loading affordances. -->
      <template #refreshHeader="{ pulling, releaseReady, refreshing: isRefreshing, done }">
        <view :style="{ padding: '12px', alignItems: 'center' }">
          <text data-testid="refresh-header-label">
            {{
              isRefreshing
                ? 'Refreshing…'
                : done
                  ? 'Updated'
                  : releaseReady
                    ? 'Release to refresh'
                    : pulling
                      ? 'Pull to refresh'
                      : 'Pull to refresh'
            }}
          </text>
        </view>
      </template>
      <template #loadMoreFooter="{ loading }">
        <view :style="{ padding: '12px', alignItems: 'center' }">
          <text data-testid="load-more-footer">{{ loading ? 'Loading more…' : 'Scroll for more' }}</text>
        </view>
      </template>
      <template #noMoreDataFooter>
        <view :style="{ padding: '12px', alignItems: 'center' }">
          <text data-testid="no-more-footer">No more items</text>
        </view>
      </template>
      <template #empty>
        <text data-testid="empty">No items</text>
      </template>
    </FeedList>
    <text data-testid="count">{{ items.length }}</text>
    <text data-testid="refreshing-state">{{ refreshing ? 'yes' : 'no' }}</text>
    <text data-testid="refresh-state">{{ refreshStateLabel }}</text>
    <text data-testid="loading-more-state">{{ loadingMore ? 'yes' : 'no' }}</text>
  </view>
</template>
