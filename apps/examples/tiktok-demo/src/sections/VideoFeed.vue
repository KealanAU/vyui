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
//   VyFeedList wraps Lynx's native `<list>` with `scroll-orientation="vertical"`
//   and `:item-snap="true"`, which maps to the native `item-snap` paging effect
//   (`{ factor: 0, offset: 0 }` — snap each item to the top). Combined with
//   per-item full screen height that gives one-video-per-swipe paging — the
//   TikTok mechanic. FeedList also handles load-more on scrolltolower, so one
//   component covers both surface features (paging + load-more).
//
//   Pull-to-refresh: this feed uses FeedList's custom rubber-band PTR
//   (`enable-refresh`, gesture-arbitrated). Pulling down at the top reveals the
//   #refreshHeader spinner and, on release, prepends "new" videos at the top —
//   the headline FeedList feature. (The comments drawer separately demos
//   load-more on scroll.)

import { ref } from 'vue'
import type { FeedListRefreshState } from '@vyui/core'
import { VyFeedList } from '@vyui/kit'
import { SEED_VIDEOS, LOAD_MORE_VIDEOS, type Video } from '../data/videos'
import VideoCard from '../components/VideoCard.vue'
import LoadCounter from '../components/LoadCounter.vue'
import Spinner from '../components/Spinner.vue'

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

// Current position in the feed (0-based) → the side badge reads e.g. "3/15"
// and ticks up/down as you flick. Derived from the list's absolute scroll
// offset rather than the `snap` event: scrollTop is reliable and present on
// every scroll, whereas the snap payload's index field varied by platform.
// Native event detail lands under `.detail` (iOS) or `.params` (Android).
const currentIndex = ref(0)

function onScroll(event: unknown) {
  const d = (event as { detail?: { scrollTop?: number }, params?: { scrollTop?: number } })
  const top = d?.detail?.scrollTop ?? d?.params?.scrollTop
  if (typeof top !== 'number' || screenH <= 0) return
  const idx = Math.round(top / screenH)
  currentIndex.value = Math.max(0, Math.min(idx, videos.value.length - 1))
}

function onLoadMore() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  // Simulate a network fetch. Using setTimeout keeps the demo self-contained.
  // Forced ~1.5s delay so the loading spinner is visible on every fetch.
  setTimeout(() => {
    videos.value = [...videos.value, ...LOAD_MORE_VIDEOS]
    allLoaded.value = true
    loadingMore.value = false
    emit('videosLoaded', LOAD_MORE_VIDEOS.length)
  }, 1500)
}

// --- Pull-to-refresh (FeedList enable-refresh) ---------------------------
// The engine sets `refreshing` true + emits `refresh` once the pull crosses
// the threshold and is released; we do the async fetch, prepend the new videos,
// then set `refreshing = false` to end it and spring the header closed.
const refreshing = ref(false)
let refreshSeq = 0

function onRefresh() {
  // Forced ~1.5s so the spinner header is clearly visible on every pull.
  setTimeout(() => {
    refreshSeq += 1
    // Three "new" videos: clone seed items with fresh ids so picsum returns
    // different images and the keys stay unique.
    const fresh: Video[] = SEED_VIDEOS.slice(0, 3).map((v, i) => ({
      ...v,
      id: `fresh-${refreshSeq}-${i}`,
    }))
    videos.value = [...fresh, ...videos.value]
    currentIndex.value = 0
    refreshing.value = false
    emit('videosLoaded', fresh.length)
  }, 1500)
}

function refreshLabel(state: FeedListRefreshState, _progress: number): string {
  if (state === 'refreshing') return 'Refreshing…'
  if (state === 'releaseReady') return 'Release to refresh'
  if (state === 'done') return 'Done'
  return 'Pull to refresh'
}
</script>

<template>
  <!-- Full-screen container. Black background bleeds between gradient cards. -->
  <view class="w-full h-full bg-black relative">

    <!-- Position counter — pinned to the SIDE (top-right). Shows the current
         video (1-based) out of the total loaded, updated by the list `snap`
         event so it ticks up/down as you flick between videos. -->
    <view
      class="absolute top-12 right-3 flex flex-row justify-end"
      :style="{ zIndex: 20 }"
    >
      <LoadCounter :loaded="currentIndex + 1" :total="videos.length" label="videos" />
    </view>

    <!-- Vertical paging feed. `:item-snap="true"` = native paging (one video
         per swipe). `:enable-refresh` = custom rubber-band pull-to-refresh:
         pull down at the top, release, and new videos prepend. -->
    <VyFeedList
      :items="videos"
      item-key-field="id"
      scroll-orientation="vertical"
      :item-snap="true"
      :enable-refresh="true"
      v-model:refreshing="refreshing"
      :refresh-threshold="72"
      :enable-load-more="!allLoaded"
      :load-more-threshold-item-count="2"
      class="w-full h-full"
      @refresh="onRefresh"
      @load-more="onLoadMore"
      @scroll="onScroll"
    >
      <!-- Pull-to-refresh header. Revealed as you pull; `state`/`progress` come
           from the gesture engine. Sized to the refresh threshold (72px). -->
      <template #refreshHeader="{ state, progress }">
        <view class="w-full h-full flex flex-row items-center justify-center gap-2">
          <Spinner v-if="state === 'refreshing'" :size="18" color="#ffffff" />
          <text class="text-white/90 text-xs">
            {{ refreshLabel(state, progress) }}
          </text>
        </view>
      </template>

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
        <Spinner :size="16" color="#ffffff" />
        <text class="text-white text-xs">Loading more…</text>
      </view>
    </view>
  </view>
</template>
