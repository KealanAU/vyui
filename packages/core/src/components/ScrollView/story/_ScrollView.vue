<script setup lang="ts">
import { computed, ref } from 'vue'

import { ScrollView } from '..'
import type { ScrollToBouncesInfo, SingleSidedBounce } from '..'

const props = defineProps<{
  itemCount?: number
  scrollOrientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  /** Turn on the custom main-thread bounce + overscroll indicators. */
  enableBounces?: boolean
  singleSidedBounce?: SingleSidedBounce
  enableRTL?: boolean
}>()

const itemCount = computed(() => props.itemCount ?? 24)
const items = computed(() =>
  Array.from({ length: itemCount.value }, (_, i) => ({ id: i, label: `Item ${i + 1}` })),
)

// Last bounce event, so the story surfaces that `scrollToBounces` fired.
const lastBounce = ref<ScrollToBouncesInfo | null>(null)
function onScrollToBounces(info: ScrollToBouncesInfo): void {
  lastBounce.value = info
}
</script>

<template>
  <view>
    <ScrollView
      :scroll-orientation="scrollOrientation ?? 'vertical'"
      :disabled="disabled"
      :enable-bounces="enableBounces"
      :single-sided-bounce="singleSidedBounce ?? 'both'"
      :enable-rtl="enableRTL"
      :start-bounce-trigger-distance="48"
      :end-bounce-trigger-distance="48"
      :style="{ width: '100%', height: '400px' }"
      data-testid="scroll-view"
      @scroll-to-bounces="onScrollToBounces"
    >
      <!-- Overscroll indicators — only mounted when enableBounces is on. -->
      <template #upperBounceItem>
        <view
          data-testid="bounce-upper"
          :style="{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
        >
          <text>Release to refresh ↓</text>
        </view>
      </template>
      <template #lowerBounceItem>
        <view
          data-testid="bounce-lower"
          :style="{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }"
        >
          <text>Release to load more ↑</text>
        </view>
      </template>

      <view
        v-for="item in items"
        :key="item.id"
        :data-testid="`item-${item.id}`"
        :style="{ height: '60px', padding: '12px' }"
      >
        <text>{{ item.label }}</text>
      </view>
    </ScrollView>

    <view v-if="enableBounces" data-testid="bounce-readout" :style="{ padding: '8px' }">
      <text>
        Last bounce: {{ lastBounce ? lastBounce.direction : 'none' }}
      </text>
    </view>
  </view>
</template>
