<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyFeedList } from '@vyui/kit'

// FeedList — native `<list>` virtualization with debounced load-more (scroll to
// the bottom) and custom rubber-band pull-to-refresh (pull down at the top).
// PTR rides `:main-thread-bindtouch*` worklets gated to the top edge — no native
// `<refresh>`, no gesture-runtime. See @vyui/core FeedList/REFRESH-PHYSICS.md.
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
const refreshing = ref(false)

// FeedList sets `refreshing` true and emits `refresh`; reset, then flip it false.
function onRefresh(): void {
  setTimeout(() => {
    resetFeed()
    refreshing.value = false
  }, 1000)
}

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
  <view class="flex flex-col flex-1 min-h-0">
    <view class="bg-white border border-slate-200 rounded-lg p-3 flex flex-col flex-1 min-h-0 gap-2">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">FeedList</text>
        <text class="text-slate-500 text-xs">{{ feedItems.length }} items</text>
      </view>
      <text class="text-slate-500 text-xs">Pull down to refresh; scroll to the bottom to load more.</text>

      <!-- Fill the viewport space left by the tabs and controls. The native
           `<list>` owns scrolling inside this flex-bounded region. -->
      <view class="flex-1 min-h-0">
        <VyFeedList
          v-model:refreshing="refreshing"
          :items="feedItems"
          :item-key="(it) => String(it.id)"
          enable-refresh
          enable-bounce
          enable-load-more
          :no-more-data="noMoreData"
          class="h-full"
          @refresh="onRefresh"
          @load-more="onLoadMore"
        >
          <template #refreshHeader="{ state, progress }">
            <view class="h-full flex items-center justify-center">
              <text
                class="text-slate-400 text-xs"
                :style="{ opacity: String(Math.max(0.4, progress)) }"
              >
                {{ state === 'refreshing' ? 'Refreshing…' : state === 'releaseReady' ? 'Release to refresh' : 'Pull to refresh' }}
              </text>
            </view>
          </template>
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

      <view class="flex flex-row items-center justify-center">
        <VyButton variant="ghost" size="sm" @click="resetFeed">
          Reset feed
        </VyButton>
      </view>
    </view>
  </view>
</template>
