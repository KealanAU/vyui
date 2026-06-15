<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyFeedList } from '@vyui/kit'

// FeedList — native `<list>` virtualization with debounced load-more (scroll to
// the bottom). Pull-to-refresh is intentionally not part of FeedList (the native
// `<refresh>` element is unused upstream and absent from the OSS runtime).
//
// The feed gets its own tall, self-contained scroll region: the native `<list>`
// owns its vertical scrolling, so we give it a bounded height rather than letting
// it sit inside the demo's outer vertical `<scroll-view>` (nesting two vertical
// scrollers is a known Lynx gotcha that breaks both scrollers' gesture routing).
// Cap the demo feed so it stops growing (load-more appends 10 each time).
const MAX_ITEMS = 50
let nextFeedId = 21
const initialFeed = (): { id: number, title: string }[] =>
  Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` }))
const feedItems = ref(initialFeed())
const noMoreData = ref(false)

function onLoadMore(): void {
  const base = feedItems.value.length
  const remaining = MAX_ITEMS - base
  if (remaining <= 0) {
    noMoreData.value = true
    return
  }
  const add = Math.min(10, remaining)
  feedItems.value = [
    ...feedItems.value,
    ...Array.from({ length: add }, (_, i) => ({ id: nextFeedId + i, title: `Item ${base + i + 1}` })),
  ]
  nextFeedId += add
  if (feedItems.value.length >= MAX_ITEMS) noMoreData.value = true
}

function resetFeed(): void {
  nextFeedId = 21
  feedItems.value = initialFeed()
  noMoreData.value = false
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">FeedList</text>
        <text class="text-slate-500 text-xs">{{ feedItems.length }} items</text>
      </view>
      <text class="text-slate-500 text-xs">Scroll to the bottom to load more (debounced).</text>

      <!-- Tall, bounded region so load-more is actually exercisable.
           The native `<list>` owns scrolling inside this height. -->
      <view :style="{ height: '440px' }">
        <VyFeedList
          :items="feedItems"
          :item-key="(it) => String(it.id)"
          enable-load-more
          :no-more-data="noMoreData"
          class="h-full"
          @load-more="onLoadMore"
        >
          <template #item="{ item }">
            <view class="border-b border-slate-100 h-14 flex flex-row items-center px-2">
              <text class="text-slate-900 text-sm">{{ item.title }}</text>
            </view>
          </template>
          <template #noMoreDataFooter>
            <view class="h-12 flex items-center justify-center">
              <text class="text-slate-400 text-xs">No more items ({{ MAX_ITEMS }} max)</text>
            </view>
          </template>
        </VyFeedList>
      </view>

      <view class="flex flex-row items-center justify-center pt-1">
        <VyButton variant="ghost" size="sm" @click="resetFeed">
          Reset feed
        </VyButton>
      </view>
    </view>
  </view>
</template>
