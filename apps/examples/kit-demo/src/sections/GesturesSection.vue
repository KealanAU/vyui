<script setup lang="ts">
import SwipeActionCard from './gestures/SwipeActionCard.vue'
import SortableCard from './gestures/SortableCard.vue'

// Gesture surfaces demo. This tab disables the outer page scroll (see App.vue's
// NON_SCROLLING_TABS) so the SwipeAction / Sortable worklets own the vertical
// touch stream instead of the page scrolling under the finger. Each card is its
// own self-contained component (state + worklets colocated with its markup).
</script>

<template>
  <view class="flex flex-row flex-wrap flex-1 min-h-0 gap-3">
    <SwipeActionCard />
    <SortableCard />
  </view>
</template>
