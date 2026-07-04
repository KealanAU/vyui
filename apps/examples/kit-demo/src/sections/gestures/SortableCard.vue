<script setup lang="ts">
import { ref } from 'vue'
import { VySortable } from '@vyui/kit'

// Sortable — drag to reorder; the list reflects the committed order via v-model.
// `long-press-ms="0"` lifts immediately on press so a simulator mouse click-drag
// works without holding. The Gestures tab disables the outer page scroll (see
// App.vue) so instant drag won't fight page scrolling. Edge autoscroll +
// clamping come from core.
const tags = ref(['Design', 'Engineering', 'Product', 'Research'])
</script>

<template>
  <view class="bg-white border border-slate-200 rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
    <text class="text-slate-900 text-base font-semibold">Sortable</text>
    <text class="text-slate-500 text-xs">Press a row and drag to reorder. Current: {{ tags.join(' · ') }}</text>
    <VySortable v-model="tags" :long-press-ms="0">
      <template #item="{ item }">
        <view class="bg-slate-50 border border-slate-200 rounded-md h-10 flex flex-row items-center px-3 mb-1.5">
          <text class="text-slate-400 text-base mr-3">⠿</text>
          <text class="text-slate-900 text-sm">{{ item }}</text>
        </view>
      </template>
    </VySortable>
  </view>
</template>
