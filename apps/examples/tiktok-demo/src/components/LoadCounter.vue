<script setup lang="ts">
// N/total overlay badge. Renders at top-center over the feed, updating as
// both the video feed and the comments list load-more handlers fire.
// The badge uses an opaque pill so it's legible over any gradient card.

defineProps<{
  loaded: number
  total: number
  // Extra label for context ("videos", "comments") — optional.
  label?: string
}>()
</script>

<template>
  <view
    class="px-3 py-1 rounded-full bg-black/60 flex flex-row items-center gap-1"
    data-vyui-tiktok-counter
  >
    <text class="text-white text-xs font-semibold">{{ loaded }}/{{ total }}</text>
    <text v-if="label" class="text-white/60 text-xs">{{ label }}</text>
  </view>
</template>
