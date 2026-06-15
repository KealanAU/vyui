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
//   Pull-to-refresh is intentionally NOT used here — the upstream-derived
//   refresh header was dropped; this demo is about snap paging + the comments
//   drawer's load-on-scroll, not PTR.

import { ref } from 'vue'
import { VyFeedList } from '@vyui/kit'
import { SEED_VIDEOS, LOAD_MORE_VIDEOS, type Video } from '../data/videos'
import VideoCard from '../components/VideoCard.vue'
import LoadCounter from '../components/LoadCounter.vue'

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

// Current position in the feed (0-based). Updated by the native list `snap`
// event each time paging settles on a video — so the side badge reads e.g.
// "3/15" and ticks up/down as you flick. This also makes snap paging visibly
// verifiable: if the number doesn't change per swipe, snap isn't firing.
const currentIndex = ref(0)

function onSnap(event: unknown) {
  const pos = (event as { detail?: { position?: number } })?.detail?.position
  if (typeof pos === 'number') currentIndex.value = pos
}

function onLoadMore() {
  if (loadingMore.value || allLoaded.value) return
  loadingMore.value = true
  // Simulate a network fetch. Using setTimeout keeps the demo self-contained.
  setTimeout(() => {
    videos.value = [...videos.value, ...LOAD_MORE_VIDEOS]
    allLoaded.value = true
    loadingMore.value = false
    emit('videosLoaded', LOAD_MORE_VIDEOS.length)
  }, 700)
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

    <!-- Vertical paging feed. `:item-snap="true"` enables the native list
         paging effect; combined with full-screen-height items the list snaps
         one video per swipe (the TikTok mechanic). `enable-load-more` triggers
         `onLoadMore` when the user nears the last item. -->
    <VyFeedList
      :items="videos"
      item-key-field="id"
      scroll-orientation="vertical"
      :item-snap="true"
      :enable-load-more="!allLoaded"
      :load-more-threshold-item-count="2"
      class="w-full h-full"
      @load-more="onLoadMore"
      @snap="onSnap"
    >
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
