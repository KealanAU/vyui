<script setup lang="ts">
// Per-section scroll container. Each content tab owns its scrolling instead of
// the page: the header + tab bar stay pinned (no jolt when switching to a
// gesture tab), the outer element never swaps type (which remounted the ENTIRE
// page tree), and a kept-alive hidden section retains its own scroll state.
</script>

<template>
  <scroll-view class="w-full h-full" scroll-orientation="vertical">
    <view class="flex flex-col gap-4 pb-2">
      <slot />
      <view class="flex flex-col items-center pt-2 pb-1">
        <text class="text-dimmed text-xs">@vyui/kit · Vue-Lynx · Tailwind v3</text>
      </view>
    </view>
  </scroll-view>
</template>
