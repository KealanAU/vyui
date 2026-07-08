<script setup lang="ts">
import SwipeDeckCard from './gestures/SwipeDeckCard.vue'

// Own tab (not squeezed into GesturesSection's card row) so the deck gets
// room to breathe. Disables the outer page scroll (see App.vue's
// NON_SCROLLING_TABS) so the drag worklet owns the touch stream.
</script>

<template>
  <view class="flex flex-col flex-1 min-h-0 items-center justify-center">
    <SwipeDeckCard />
  </view>
</template>
