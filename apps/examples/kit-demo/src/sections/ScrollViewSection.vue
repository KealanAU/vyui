<script setup lang="ts">
import { ScrollView } from '@vyui/core'

// ScrollView — native vertical scrolling with iOS rubber-band overscroll (the
// underlying element is a real UIScrollView, so bounce comes for free).
//
// NOTE: the custom main-thread bounce system (`enable-bounces` + bounce-item
// slots) is currently not working on-device — the worklets receive touches but
// don't drive the transform. Until that's fixed we demo the native path, which
// scrolls and bounces. See ScrollView.vue for the custom-bounce caveat. This
// region's tab renders a non-scrolling container so this is the only vertical
// scroller (no nesting conflict).
</script>

<template>
  <view class="flex flex-col flex-1 min-h-0">
    <view class="bg-white border border-slate-200 rounded-lg p-3 flex flex-col flex-1 min-h-0 gap-2">
      <text class="text-slate-900 text-base font-semibold">ScrollView</text>
      <text class="text-slate-500 text-xs">
        Scroll the panel; overscroll past either edge for the native rubber-band bounce.
      </text>

      <view class="flex-1 min-h-0">
        <ScrollView class="h-full">
          <view class="flex flex-col">
            <view
              v-for="n in 24"
              :key="n"
              class="border-b border-slate-100 h-12 flex flex-row items-center px-2"
            >
              <text class="text-slate-900 text-sm">Row {{ n }}</text>
            </view>
          </view>
        </ScrollView>
      </view>
    </view>
  </view>
</template>
