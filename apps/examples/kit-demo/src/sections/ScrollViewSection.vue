<script setup lang="ts">
import { computed, ref } from 'vue'
import { getViewportSize, ScrollView } from '@vyui/core'

// ScrollView — native vertical scrolling with iOS rubber-band overscroll (the
// underlying element is a real UIScrollView, so bounce comes for free).
//
// Like <list>, the native <scroll-view> needs a DEFINITE height: `flex-1
// min-h-0` + `h-full` measures 0px and nothing scrolls. Measure the flex slot,
// fall back to a screen fraction (the header prints which one is live).
//
// NOTE: the custom main-thread bounce system (`enable-bounces` + bounce-item
// slots) is currently not working on-device — the worklets receive touches but
// don't drive the transform. Until that's fixed we demo the native path, which
// scrolls and bounces.
const measuredHeight = ref(0)
const fallbackHeight = Math.round((getViewportSize()?.height ?? 812) * 0.5)
const scrollHeight = computed(() => measuredHeight.value || fallbackHeight)

function onSlotLayout(event: any): void {
  const height = event?.detail?.height ?? event?.params?.height
  if (typeof height === 'number' && height > 0) measuredHeight.value = Math.round(height)
}
</script>

<template>
  <view class="flex flex-col flex-1 min-h-0">
    <view class="bg-default border border-default rounded-lg p-3 flex flex-col flex-1 min-h-0 gap-2">
      <view class="flex flex-row items-center justify-between">
        <text class="text-highlighted text-base font-semibold">ScrollView</text>
        <text class="text-muted text-xs">{{ scrollHeight }}px {{ measuredHeight ? 'measured' : 'fallback' }}</text>
      </view>
      <text class="text-muted text-xs">
        Scroll the panel; overscroll past either edge for the native rubber-band bounce.
      </text>

      <view class="flex-1 min-h-0" @layoutchange="onSlotLayout">
        <view :style="{ height: `${scrollHeight}px` }">
          <ScrollView class="w-full h-full">
            <view class="flex flex-col">
              <view
                v-for="n in 24"
                :key="n"
                class="border-b border-muted h-12 flex flex-row items-center px-2"
              >
                <text class="text-highlighted text-sm">Row {{ n }}</text>
              </view>
            </view>
          </ScrollView>
        </view>
      </view>
    </view>
  </view>
</template>
