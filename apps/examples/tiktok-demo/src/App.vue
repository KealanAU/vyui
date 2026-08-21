<script setup lang="ts">
import { ref } from 'vue'
import { OverlayRoot } from '@vyui/core'
import VideoFeed from './sections/VideoFeed.vue'
import CommentsDrawer from './components/CommentsDrawer.vue'

// Comments drawer open state — lifted here so VideoCard's comment-button tap
// can open it without the drawer and feed being siblings in the same component.
const commentsOpen = ref(false)
const _activeVideoId = ref<string | null>(null)

function openComments(videoId: string) {
  _activeVideoId.value = videoId
  commentsOpen.value = true
}

// Global N/total counter that spans both the video feed and the comments list.
// Each domain starts its own segment; we track the combined loaded count here
// so an app-level figure reflects all loaded data, not just one list.
const globalLoaded = ref(0)

function onVideosLoaded(count: number) {
  globalLoaded.value += count
}

function onCommentsLoaded(count: number) {
  globalLoaded.value += count
}
</script>

<template>
  <!-- OverlayRoot must be a direct child of the root view so SheetRoot /
       DrawerRoot can portal their backdrops and content above everything else.
       The feed is full-screen black; OverlayRoot renders nothing by itself. -->
  <view class="w-full h-full bg-black">
    <OverlayRoot />

    <!-- Full-screen vertical video feed. -->
    <VideoFeed
      class="w-full h-full"
      @open-comments="openComments"
      @videos-loaded="onVideosLoaded"
    />

    <!-- Comments drawer — opened programmatically from VideoCard tap events.
         v-model:open is driven by the openComments handler above.
         commentsLoaded bubbles up so the global counter can track comment batches. -->
    <CommentsDrawer
      v-model:open="commentsOpen"
      @comments-loaded="onCommentsLoaded"
    />
  </view>
</template>
