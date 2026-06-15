<script setup lang="ts">
// Vertical full-screen video feed.
//
// SWIPER VS FEEDLIST CHOICE — VyFeedList:
//   VySwiper's core (`SwiperRoot.vue`) hardcodes `flexDirection: 'row'` and
//   `useDragGesture` is labelled "shared horizontal drag-gesture controller"
//   — there is no vertical axis support today. The `direction: 'vertical'`
//   variant in the kit theme only repositions the dot indicators; the actual
//   swipe axis is always horizontal.
//
//   VyFeedList wraps Lynx's native `<list>` which handles vertical-paging
//   natively with `scroll-orientation="vertical"`. Each item is `h-full`
//   (100vh on Lynx) so the list snap-scrolls one video per swipe — the same
//   mechanical feel as TikTok. FeedList also ships load-more on scrolltolower
//   and the PTR refresh slot that PTR integration needs, making it the single
//   component that handles all three surface-level features (paging, load-more,
//   future PTR).

import { ref } from 'vue'
import { VyFeedList } from '@vyui/kit'
import { SEED_VIDEOS, LOAD_MORE_VIDEOS, type Video } from '../data/videos'
import VideoCard from '../components/VideoCard.vue'
import LoadCounter from '../components/LoadCounter.vue'
import PullRefreshHeader from '../components/PullRefreshHeader.vue'

const emit = defineEmits<{
  // Fired when the user taps the comment count on a video card.
  openComments: [videoId: string]
  // Fired when a load-more batch lands — parent updates its global counter.
  videosLoaded: [count: number]
}>()

const videos = ref<Video[]>([...SEED_VIDEOS])
const loadingMore = ref(false)
const allLoaded = ref(false)

// Full-screen paging height. A Lynx `<list-item>` sizes to its CONTENT, not to
// the list viewport — so a child `h-full` collapses and the card's absolutely
// positioned overlays render off-screen (the "video is way off the top" bug).
// Pin each item to the device screen height (CSS px = pixelHeight / pixelRatio)
// so every card fills exactly one viewport and the list pages one video per
// swipe. SystemInfo is a Lynx global; guard + fall back for non-Lynx/web preview.
const screenH = (() => {
  const sys = (globalThis as { SystemInfo?: { pixelHeight?: number, pixelRatio?: number } }).SystemInfo
  if (sys?.pixelHeight && sys?.pixelRatio) return Math.round(sys.pixelHeight / sys.pixelRatio)
  return 812 // iPhone-ish fallback for web preview
})()

// N/total counters. `loadedCount` ticks up as batches land; `totalCount` is the
// ceiling (seed + load-more). Both are shown in the overlay LoadCounter badge.
const loadedCount = ref(SEED_VIDEOS.length)
const totalCount = ref(SEED_VIDEOS.length + LOAD_MORE_VIDEOS.length)

// refreshing v-model — will be bound to FeedList when PTR ships.
// Declared here so refreshFeed() can set it and the template can read it.
const refreshing = ref(false)

function onLoadMore() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  // Simulate a network fetch. Using setTimeout keeps the demo self-contained.
  setTimeout(() => {
    videos.value = [...videos.value, ...LOAD_MORE_VIDEOS]
    loadedCount.value = videos.value.length
    allLoaded.value = true
    loadingMore.value = false
    emit('videosLoaded', LOAD_MORE_VIDEOS.length)
  }, 700)
}

/**
 * PTR handler — prepends 3 new mock videos and bumps the N/total counter.
 * Ready to attach to `@refresh` on VyFeedList once `enableRefresh` ships.
 *
 * INTEGRATION(PTR): once @vyui/core FeedList ships enableRefresh, wire
 *   :enable-refresh="true" + v-model:refreshing="refreshing" + @refresh="refreshFeed"
 *   on the VyFeedList below, AND uncomment the #refreshHeader slot block.
 *   Contract: state ∈ 'idle'|'pulling'|'releaseReady'|'refreshing'|'done',
 *   progress 0..1.
 */
function refreshFeed() {
  if (refreshing.value) return
  refreshing.value = true
  setTimeout(() => {
    // Prepend 3 synthetic "new" videos — clones of seed items with fresh ids.
    const fresh: Video[] = SEED_VIDEOS.slice(0, 3).map((v, i) => ({
      ...v,
      id: `refresh-${Date.now()}-${i}`,
    }))
    videos.value = [...fresh, ...videos.value]
    totalCount.value += fresh.length
    loadedCount.value += fresh.length
    refreshing.value = false
  }, 1200)
}

// Expose refreshFeed so App.vue can call it from a debug button if needed.
defineExpose({ refreshFeed })
</script>

<template>
  <!-- Full-screen container. Black background bleeds between gradient cards. -->
  <view class="w-full h-full bg-black relative">

    <!-- N/total counter — pinned to the SIDE (top-right), not centered, so it
         reads as an unobtrusive "what's loaded" indicator rather than the main
         event. The drawer's own counter tracks comments separately. -->
    <view
      class="absolute top-12 right-3 flex flex-row justify-end"
      :style="{ zIndex: 20 }"
    >
      <LoadCounter :loaded="loadedCount" :total="totalCount" label="videos" />
    </view>

    <!-- Vertical paging feed. Each item is full-screen height so Lynx's native
         list scroll snaps one item at a time — the TikTok paging mechanic.
         `enable-load-more` triggers `onLoadMore` when the user nears the last
         item. PTR wiring is commented in the block below. -->
    <VyFeedList
      :items="videos"
      item-key-field="id"
      scroll-orientation="vertical"
      :enable-load-more="!allLoaded"
      :load-more-threshold-item-count="2"
      class="w-full h-full"
      @load-more="onLoadMore"
    >
      <!--
        INTEGRATION(PTR): once @vyui/core FeedList ships enableRefresh,
        replace the opening <VyFeedList> tag above with:

          <VyFeedList
            :items="videos"
            item-key-field="id"
            scroll-orientation="vertical"
            :enable-load-more="!allLoaded"
            :load-more-threshold-item-count="2"
            :enable-refresh="true"
            v-model:refreshing="refreshing"
            class="w-full h-full"
            @load-more="onLoadMore"
            @refresh="refreshFeed"
          >

        And uncomment the #refreshHeader slot below:

          <template #refreshHeader>
            <PullRefreshHeader
              :loaded="loadedCount"
              :total="totalCount"
            />
          </template>

        The PullRefreshHeader component already renders the N/total badge and
        a state-aware arrow/spinner — just pass `state` and `progress` from
        the slot's scoped props once the slot emits them.
      -->

      <template #item="{ item }">
        <!-- Pin each item to one screen height (see screenH) so the card's
             absolute overlays anchor correctly and the list pages one video
             per swipe. Without the explicit height the item collapses to its
             content box and the card renders off the top of the screen. -->
        <view class="w-full" :style="{ height: `${screenH}px` }">
          <VideoCard
            :video="item"
            @open-comments="emit('openComments', $event)"
          />
        </view>
      </template>
    </VyFeedList>

    <!-- Loading spinner shown below the feed while a batch fetches. -->
    <view
      v-if="loadingMore"
      class="absolute bottom-4 left-0 right-0 flex flex-row justify-center"
      :style="{ zIndex: 20 }"
    >
      <view class="px-3 py-1 rounded-full bg-black/70 flex flex-row items-center gap-2">
        <text class="text-white text-xs">Loading more…</text>
      </view>
    </view>
  </view>
</template>
