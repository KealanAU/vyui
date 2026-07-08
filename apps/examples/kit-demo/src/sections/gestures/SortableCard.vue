<script setup lang="ts">
import { ref } from 'vue'
import { VySortable } from '@vyui/kit'

// Sortable — drag to reorder; the list reflects the committed order via v-model.
// `long-press-ms="0"` lifts immediately on press so a simulator mouse click-drag
// works without holding. The Gestures tab disables the outer page scroll (see
// App.vue) so instant drag won't fight page scrolling. Edge autoscroll +
// clamping come from core. Row pills come from the theme's `itemContent` slot —
// the slot only supplies the content inside the pill.
const tags = ref(['Design', 'Engineering', 'Product', 'Research'])
</script>

<template>
  <view class="bg-default border border-neutral-200 rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
    <text class="text-neutral-900 text-base font-semibold">Sortable</text>
    <text class="text-neutral-500 text-xs">Press a row and drag to reorder. Current: {{ tags.join(' · ') }}</text>
    <VySortable v-model="tags" :long-press-ms="0" size="sm">
      <template #item="{ item }">
        <text class="text-neutral-400 text-base">⠿</text>
        <text class="text-neutral-900 text-sm">{{ item }}</text>
      </template>
    </VySortable>
  </view>
</template>
