<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyFeedList } from '@vyui/kit'

// FeedList — native `<list>` virtualization with the refresh state machine
// (pull down to refresh) and debounced load-more (scroll to the bottom).
//
// The feed gets its own tall, self-contained scroll region: the native `<list>`
// owns its vertical scrolling, so we give it a bounded height rather than letting
// it sit inside the demo's outer vertical `<scroll-view>` (nesting two vertical
// scrollers is a known Lynx gotcha that breaks both scrollers' gesture routing).
let nextFeedId = 21
const initialFeed = (): { id: number, title: string }[] =>
  Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` }))
const feedItems = ref(initialFeed())
const refreshing = ref(false)

function onRefresh(): void {
  // Simulated network refresh — the state machine holds `refreshing` until we
  // flip it back, then rebounds the header.
  setTimeout(() => {
    feedItems.value = [{ id: nextFeedId++, title: `Fresh item ${nextFeedId}` }, ...feedItems.value]
    refreshing.value = false
  }, 900)
}

function onLoadMore(): void {
  const base = feedItems.value.length
  feedItems.value = [
    ...feedItems.value,
    ...Array.from({ length: 10 }, (_, i) => ({ id: nextFeedId + i, title: `Item ${base + i + 1}` })),
  ]
  nextFeedId += 10
}

function resetFeed(): void {
  nextFeedId = 21
  feedItems.value = initialFeed()
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">FeedList</text>
        <text class="text-slate-500 text-xs">{{ feedItems.length }} items</text>
      </view>
      <text class="text-slate-500 text-xs">Pull down to refresh · scroll to the bottom to load more.</text>
      <!-- Native pull-to-refresh relies on the runtime providing a `<refresh>`
           element. Some Lynx runtimes (e.g. iOS sdk 1.4.0) ship without it, in
           which case the list still scrolls and loads more, but the pull-down
           refresh gesture is unavailable. -->
      <text class="text-amber-600 text-xs">
        Note: native pull-to-refresh depends on runtime &lt;refresh&gt; support; on runtimes without it,
        the list still scrolls and loads more.
      </text>

      <!-- Tall, bounded region so refresh + load-more are actually exercisable.
           The native `<list>` owns scrolling inside this height. -->
      <view :style="{ height: '440px' }">
        <VyFeedList
          v-model:refreshing="refreshing"
          :items="feedItems"
          :item-key="(it) => String(it.id)"
          enable-refresh
          enable-load-more
          class="h-full"
          @refresh="onRefresh"
          @load-more="onLoadMore"
        >
          <template #item="{ item }">
            <view class="border-b border-slate-100 h-14 flex flex-row items-center px-2">
              <text class="text-slate-900 text-sm">{{ item.title }}</text>
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
