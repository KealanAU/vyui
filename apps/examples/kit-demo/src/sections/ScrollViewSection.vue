<script setup lang="ts">
import { ref } from 'vue'
import { ScrollView } from '@vyui/core'

// ScrollView — custom main-thread bounce with overscroll indicator items and the
// `scrollToBounces` event. Pull past either edge to reveal the bounce item.
//
// This gets its own tall, self-contained scroll region. The bounce
// `<scroll-view>` is itself a vertical scroller, so we bound its height and keep
// it out of the demo's outer vertical `<scroll-view>`: nesting two vertical
// scrollers is a known Lynx gotcha that confuses gesture routing and overscroll.
const lastBounce = ref<string>('—')
function onBounce(info: unknown): void {
  lastBounce.value = (info as { direction: string }).direction
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">ScrollView · bounce</text>
        <text class="text-slate-500 text-xs">Last bounce: {{ lastBounce }}</text>
      </view>
      <text class="text-slate-500 text-xs">
        Scroll within the panel, then overscroll past either edge to reveal the bounce indicator.
      </text>

      <!-- Tall, bounded region: enough rows that the content scrolls, and the
           overscroll/bounce can be triggered at both edges. -->
      <view :style="{ height: '460px' }">
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
              v-for="n in 24"
              :key="n"
              class="border-b border-slate-100 h-12 flex flex-row items-center px-2"
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
  </view>
</template>
