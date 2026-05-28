<script setup lang="ts">
import { ref } from 'vue'

import { FeedList } from '..'

const items = ref<Array<{ id: string, label: string }>>(
  Array.from({ length: 30 }, (_, i) => ({ id: `r-${i}`, label: `Row ${i + 1}` })),
)
const refreshing = ref(false)
const loadingMore = ref(false)

function onRefresh() {
  refreshing.value = true
  setTimeout(() => {
    items.value = items.value.map(it => ({ ...it, label: `${it.label} (refreshed)` }))
    refreshing.value = false
  }, 600)
}

function onLoadMore() {
  if (loadingMore.value) return
  loadingMore.value = true
  setTimeout(() => {
    const start = items.value.length
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
</script>

<template>
  <view data-vyui-feed-list-story>
    <FeedList
      v-model:refreshing="refreshing"
      :items="items"
      enable-refresh
      enable-load-more
      data-testid="feed-list"
      @refresh="onRefresh"
      @load-more="onLoadMore"
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
      <template #refreshHeader>
        <view :style="{ padding: '12px', alignItems: 'center' }">
          <text>{{ refreshing ? 'Refreshing…' : 'Pull to refresh' }}</text>
        </view>
      </template>
      <template #empty>
        <text data-testid="empty">No items</text>
      </template>
    </FeedList>
    <text data-testid="count">{{ items.length }}</text>
    <text data-testid="refreshing-state">{{ refreshing ? 'yes' : 'no' }}</text>
  </view>
</template>
