<script setup lang="ts">
// Full-bleed gradient placeholder card. One per "video" in the feed.
// In a real TikTok-style app this would be a native <video> element — here we
// use a gradient view so the demo has zero binary assets and works offline.
//
// TikTok layout: gradient fills the full screen, play glyph centred, metadata
// overlaid in the bottom-left, engagement counts down the right side.

import type { Video } from '../data/videos'

defineProps<{
  video: Video
}>()

const emit = defineEmits<{
  // Tapping the comment count opens the CommentsDrawer from the parent.
  openComments: [videoId: string]
}>()

function fmt(n: number): string {
  // Compact number formatter: 1200 → "1.2K", 1000000 → "1M".
  // We do this manually instead of Intl.NumberFormat compact because
  // installIntlPolyfill() only ships basic Intl; compact notation is not
  // guaranteed on all Lynx runtimes.
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
</script>

<template>
  <!-- Full-screen item. Height is set by the parent FeedList via `h-full` so
       each card occupies exactly one viewport height — giving the vertical-paging
       feel. The gradient is the "video" placeholder. -->
  <view class="w-full h-full relative" :style="{ background: video.gradient }">

    <!-- Centred play glyph — purely decorative, no real video playback. -->
    <view class="absolute inset-0 flex items-center justify-center">
      <view class="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center">
        <!-- Unicode triangle — avoids an icon dependency just for one glyph. -->
        <text class="text-white text-3xl" :style="{ marginLeft: '4px' }">▶</text>
      </view>
    </view>

    <!-- Bottom-left: caption + author — TikTok metadata block. -->
    <view class="absolute bottom-24 left-4 right-20 flex flex-col gap-1">
      <text class="text-white font-semibold text-base" :style="{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }">
        {{ video.author }}
      </text>
      <text class="text-white/90 text-sm" :style="{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }">
        {{ video.caption }}
      </text>
    </view>

    <!-- Right side: TikTok engagement column — likes, comments, shares. -->
    <view class="absolute bottom-24 right-3 flex flex-col items-center gap-5">

      <!-- Like -->
      <view class="flex flex-col items-center gap-1">
        <view class="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
          <text class="text-white text-xl">♥</text>
        </view>
        <text class="text-white text-xs font-medium">{{ fmt(video.likes) }}</text>
      </view>

      <!-- Comment — tap opens the CommentsDrawer. Emits to parent rather than
           opening the drawer directly so the parent owns drawer open state and
           can track which video's comments are shown. -->
      <view class="flex flex-col items-center gap-1" @tap="emit('openComments', video.id)">
        <view class="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
          <text class="text-white text-xl">💬</text>
        </view>
        <text class="text-white text-xs font-medium">{{ fmt(video.comments) }}</text>
      </view>

      <!-- Share -->
      <view class="flex flex-col items-center gap-1">
        <view class="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
          <text class="text-white text-xl">↗</text>
        </view>
        <text class="text-white text-xs font-medium">{{ fmt(video.shares) }}</text>
      </view>
    </view>
  </view>
</template>
