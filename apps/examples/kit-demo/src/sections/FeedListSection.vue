<script setup lang="ts">
import { computed, ref } from 'vue'
import { getViewportSize } from '@vyui/core'
import { VyButton, VyFeedList } from '@vyui/kit'

// FeedList — native `<list>` virtualization with load-more (scroll to the
// bottom) and custom rubber-band pull-to-refresh (pull down at the top). PTR
// rides `:main-thread-bindtouch*` worklets gated to the top edge — no native
// `<refresh>`, no gesture-runtime. See @vyui/core FeedList/REFRESH-PHYSICS.md.
//
// The feed gets its own bounded height: the native `<list>` owns its vertical
// scrolling, so it must not sit inside another vertical scroller (nesting two
// breaks both scrollers' gesture routing). Hence its own tab, not SectionScroll.
//
// `<list>` also needs a DEFINITE height — `flex-1 min-h-0` + `h-full` measures
// 0px and renders no rows at all. Measure the flex slot with a background-thread
// `@layoutchange` and hand the list those pixels, falling back to a screen
// fraction when the event doesn't arrive (the header prints which one is live).
const MAX_ITEMS = 50
let nextFeedId = 21
const initialFeed = (): { id: number, title: string }[] =>
  Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` }))
const feedItems = ref(initialFeed())
const measuredHeight = ref(0)
const fallbackHeight = Math.round((getViewportSize()?.height ?? 812) * 0.5)
const listHeight = computed(() => measuredHeight.value || fallbackHeight)
const noMoreData = ref(false)
const refreshing = ref(false)

function onSlotLayout(event: any): void {
  const height = event?.detail?.height ?? event?.params?.height
  if (typeof height === 'number' && height > 0) measuredHeight.value = Math.round(height)
}

function resetFeed(): void {
  nextFeedId = 21
  feedItems.value = initialFeed()
  noMoreData.value = false
}

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
</script>

<template>
  <view class="flex flex-col flex-1 min-h-0">
    <view class="bg-default border border-default rounded-lg p-3 flex flex-col flex-1 min-h-0 gap-2">
      <view class="flex flex-row items-center justify-between">
        <text class="text-highlighted text-base font-semibold">FeedList</text>
        <text class="text-muted text-xs">{{ feedItems.length }} items · {{ listHeight }}px {{ measuredHeight ? 'measured' : 'fallback' }}</text>
      </view>
      <text class="text-muted text-xs">Pull down to refresh; scroll to the bottom to load more.</text>

      <view class="flex-1 min-h-0" @layoutchange="onSlotLayout">
        <view :style="{ height: `${listHeight}px` }">
          <VyFeedList
            v-model:refreshing="refreshing"
            :items="feedItems"
            :item-key="(it) => String(it.id)"
            enable-refresh
            enable-bounce
            enable-load-more
            :no-more-data="noMoreData"
            class="w-full h-full"
            @refresh="onRefresh"
            @load-more="onLoadMore"
          >
            <template #refreshHeader="{ state, progress }">
              <view class="h-full flex items-center justify-center">
                <text
                  class="text-dimmed text-xs"
                  :style="{ opacity: String(Math.max(0.4, progress)) }"
                >
                  {{ state === 'refreshing' ? 'Refreshing…' : state === 'releaseReady' ? 'Release to refresh' : 'Pull to refresh' }}
                </text>
              </view>
            </template>
            <template #item="{ item }">
              <view class="border-b border-muted h-14 flex flex-row items-center px-2">
                <text class="text-highlighted text-sm">{{ item.title }}</text>
              </view>
            </template>
            <template #noMoreDataFooter>
              <view class="h-12 flex items-center justify-center">
                <text class="text-dimmed text-xs">No more items ({{ MAX_ITEMS }} max)</text>
              </view>
            </template>
          </VyFeedList>
        </view>
      </view>

      <view class="flex flex-row items-center justify-center">
        <VyButton variant="ghost" size="sm" label="Reset feed" @tap="resetFeed" />
      </view>
    </view>
  </view>
</template>
