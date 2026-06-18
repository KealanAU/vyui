<script setup lang="ts">
import { computed, ref } from 'vue'
import { runOnBackground } from 'vue-lynx'
import { OverlayRoot } from '@vyui/core'
import TopBar from './sections/TopBar.vue'
import IssueFeed from './sections/IssueFeed.vue'
import NotificationsFeed from './sections/NotificationsFeed.vue'
import BottomDock from './sections/BottomDock.vue'

// `tab` is the dock's active value — drives which page renders. The bottom
// dock's `bell` button switches us to the notifications page; `inbox`
// returns to the issue feed.
const tab = ref<string | number | null>('inbox')

// Landscape detection — a phone rotated to landscape gives a short, wide
// viewport. The fixed top/bottom islands plus the portrait `pt-20 pb-28`
// clearance would eat almost the whole height, so we tighten the feed
// padding and lift the top bar when `width > height`. Mirrors the
// `:main-thread-bindlayoutchange` worklet pattern used in the kit demo.
const isLandscape = ref(false)

function updateViewport(width: number, height: number): void {
  isLandscape.value = width > height
}

function onViewportLayoutChange(event: any): void {
  'main thread'
  const width = event?.detail?.width ?? event?.params?.width
  const height = event?.detail?.height ?? event?.params?.height
  if (typeof width === 'number' && typeof height === 'number') {
    runOnBackground(updateViewport as any)(width, height)
  }
}

// Portrait leaves generous clearance for the islands; landscape tightens it
// so the short viewport isn't dominated by empty padding.
const feedPadding = computed(() => isLandscape.value
  ? 'flex flex-col gap-2 pt-14 pb-20'
  : 'flex flex-col gap-2 pt-20 pb-28')

const pageTitle = computed(() => tab.value === 'bell' ? 'Notifications' : 'Inbox')
const pageSubtitle = computed(() =>
  tab.value === 'bell'
    ? 'vyui · Mentions, assignments, and updates'
    : 'vyui · Linear-style issue list',
)
</script>

<template>
  <view
    class="w-full h-full bg-slate-50"
    :main-thread-bindlayoutchange="onViewportLayoutChange"
  >
    <OverlayRoot />

    <!-- Feed scrolls under the floating top/bottom islands. Top + bottom
         padding leaves clearance for the islands so content isn't covered.
         Islands use inline-style `position: fixed` (see TopBar/BottomDock)
         to pin to the viewport regardless of where they sit in the tree. -->
    <scroll-view class="w-full h-full" scroll-orientation="vertical">
      <view :class="feedPadding">
        <view class="flex flex-col gap-1 px-4">
          <text class="text-slate-900 text-2xl font-bold">{{ pageTitle }}</text>
          <text class="text-slate-500 text-sm">{{ pageSubtitle }}</text>
        </view>

        <NotificationsFeed v-if="tab === 'bell'" />
        <IssueFeed v-else />
      </view>
    </scroll-view>

    <TopBar :landscape="isLandscape" />
    <BottomDock v-model:tab="tab" />
  </view>
</template>
