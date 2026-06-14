<script setup lang="ts">
import { ref } from 'vue'
import { ScrollView } from '@vyui/core'
import { VyButton, VyFeedList, VySortable, VySwipeAction } from '@vyui/kit'

// SwipeAction — the upgraded core gesture now uses velocity-aware release, so a
// quick flick opens/commits even on a short drag, while a slow drag respects the
// position threshold. `rowWidth`/`actionWidth` are the px references the core
// primitive snaps against.
const mailRows = ref([
  { id: 1, from: 'Lynx CI', subject: 'Build #482 passed' },
  { id: 2, from: 'Kealan', subject: 'Re: gesture parity' },
  { id: 3, from: 'Releases', subject: 'v0.0.6 published' },
])
function removeRow(id: number): void {
  mailRows.value = mailRows.value.filter(r => r.id !== id)
}

// Sortable — long-press / drag to reorder. The list reflects the committed order
// via v-model. Edge autoscroll + clamping come from the core upgrade.
const tags = ref(['Design', 'Engineering', 'Product', 'Research', 'Support'])

// FeedList — native `<list>` virtualization with the new refresh state machine
// (pull down to refresh) and debounced load-more (scroll to the bottom).
let nextFeedId = 21
const feedItems = ref(
  Array.from({ length: 20 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` })),
)
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

// ScrollView — custom main-thread bounce with overscroll indicator items and the
// `scrollToBounces` event. Pull past either edge to reveal the bounce item.
const lastBounce = ref<string>('—')
function onBounce(info: unknown): void {
  lastBounce.value = (info as { direction: string }).direction
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- SwipeAction (velocity-aware release) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">SwipeAction</text>
      <text class="text-slate-500 text-xs">Swipe a row left · flick to commit · slow-drag respects threshold.</text>
      <view class="flex flex-col gap-2">
        <VySwipeAction
          v-for="row in mailRows"
          :key="row.id"
          :row-width="300"
          :action-width="80"
          side="right"
        >
          <view class="bg-white h-16 flex flex-col justify-center px-4" :style="{ width: '300px' }">
            <text class="text-slate-900 text-sm font-medium">{{ row.from }}</text>
            <text class="text-slate-500 text-xs">{{ row.subject }}</text>
          </view>
          <template #actions="{ close }">
            <view
              class="bg-rose-500 h-16 flex items-center justify-center"
              :style="{ width: '80px' }"
              @tap="removeRow(row.id); close()"
            >
              <text class="text-white text-sm font-semibold">Delete</text>
            </view>
          </template>
        </VySwipeAction>
      </view>
    </view>

    <!-- Sortable (edge autoscroll + clamping) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Sortable</text>
      <text class="text-slate-500 text-xs">Drag to reorder. Current: {{ tags.join(' · ') }}</text>
      <VySortable v-model="tags">
        <template #item="{ item }">
          <view class="bg-slate-50 border border-slate-200 rounded-md h-11 flex flex-row items-center px-3 mb-2">
            <text class="text-slate-400 text-base mr-3">⠿</text>
            <text class="text-slate-900 text-sm">{{ item }}</text>
          </view>
        </template>
      </VySortable>
    </view>

    <!-- FeedList (refresh state machine + debounced load-more) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">FeedList</text>
      <text class="text-slate-500 text-xs">Pull down to refresh · scroll to the bottom to load more.</text>
      <view :style="{ height: '260px' }">
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
            <view class="border-b border-slate-100 h-12 flex flex-row items-center px-1">
              <text class="text-slate-900 text-sm">{{ item.title }}</text>
            </view>
          </template>
        </VyFeedList>
      </view>
    </view>

    <!-- ScrollView (custom main-thread bounce) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">ScrollView · bounce</text>
        <text class="text-slate-500 text-xs">Last bounce: {{ lastBounce }}</text>
      </view>
      <text class="text-slate-500 text-xs">Overscroll past either edge to reveal the bounce indicator.</text>
      <view :style="{ height: '220px' }">
        <ScrollView
          enable-bounces
          class="h-full"
          @scroll-to-bounces="onBounce"
        >
          <template #upperBounceItem>
            <view class="h-12 flex items-center justify-center">
              <text class="text-slate-400 text-xs">↓ release to bounce</text>
            </view>
          </template>
          <view class="flex flex-col">
            <view
              v-for="n in 12"
              :key="n"
              class="border-b border-slate-100 h-12 flex flex-row items-center px-1"
            >
              <text class="text-slate-900 text-sm">Row {{ n }}</text>
            </view>
          </view>
          <template #lowerBounceItem>
            <view class="h-12 flex items-center justify-center">
              <text class="text-slate-400 text-xs">↑ release to bounce</text>
            </view>
          </template>
        </ScrollView>
      </view>
    </view>

    <view class="flex flex-row items-center justify-center pt-1">
      <VyButton variant="ghost" size="sm" @click="feedItems = feedItems.slice(0, 20)">
        Reset feed
      </VyButton>
    </view>
  </view>
</template>
