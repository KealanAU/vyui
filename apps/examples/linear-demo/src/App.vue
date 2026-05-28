<script setup lang="ts">
import { computed, ref } from 'vue'
import { OverlayRoot } from '@vyui/core'
import TopBar from './sections/TopBar.vue'
import IssueFeed from './sections/IssueFeed.vue'
import NotificationsFeed from './sections/NotificationsFeed.vue'
import BottomDock from './sections/BottomDock.vue'

// `tab` is the dock's active value — drives which page renders. The bottom
// dock's `bell` button switches us to the notifications page; `inbox`
// returns to the issue feed.
const tab = ref<string | number | null>('inbox')

const pageTitle = computed(() => tab.value === 'bell' ? 'Notifications' : 'Inbox')
const pageSubtitle = computed(() =>
  tab.value === 'bell'
    ? 'vyui · Mentions, assignments, and updates'
    : 'vyui · Linear-style issue list',
)
</script>

<template>
  <view class="w-full h-full bg-slate-50">
    <OverlayRoot />

    <!-- Feed scrolls under the floating top/bottom islands. Top + bottom
         padding leaves clearance for the islands so content isn't covered.
         Islands use inline-style `position: fixed` (see TopBar/BottomDock)
         to pin to the viewport regardless of where they sit in the tree. -->
    <scroll-view class="w-full h-full" scroll-orientation="vertical">
      <view class="flex flex-col gap-2 pt-20 pb-28">
        <view class="flex flex-col gap-1 px-4">
          <text class="text-slate-900 text-2xl font-bold">{{ pageTitle }}</text>
          <text class="text-slate-500 text-sm">{{ pageSubtitle }}</text>
        </view>

        <NotificationsFeed v-if="tab === 'bell'" />
        <IssueFeed v-else />
      </view>
    </scroll-view>

    <TopBar />
    <BottomDock v-model:tab="tab" />
  </view>
</template>
