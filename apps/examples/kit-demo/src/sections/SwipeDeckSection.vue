<script setup lang="ts">
import SwipeDeckCard from './gestures/SwipeDeckCard.vue'

// Own tab (not squeezed into GesturesSection's card row) so the deck gets
// room to breathe. Renders bare (no SectionScroll wrapper — see App.vue) so
// the drag worklet owns the touch stream.
</script>

<template>
  <view class="flex flex-col flex-1 min-h-0 items-center justify-center">
    <SwipeDeckCard />
  </view>
</template>
