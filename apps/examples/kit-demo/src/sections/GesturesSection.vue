<script setup lang="ts">
import { ref } from 'vue'
import { VySortable, VySwipeAction } from '@vyui/kit'

// SwipeAction — the upgraded core gesture now uses velocity-aware release, so a
// quick flick opens/commits even on a short drag, while a slow drag respects the
// position threshold. `rowWidth`/`actionWidth` are the px references the core
// primitive snaps against.
const mailRows = ref([
  { id: 1, from: 'Lynx CI', subject: 'Build #482 passed' },
  { id: 2, from: 'Kealan', subject: 'Re: gesture parity' },
  { id: 3, from: 'Releases', subject: 'v0.0.6 published' },
])
function removeRow(id: number): void {
  mailRows.value = mailRows.value.filter(r => r.id !== id)
}

// Sortable — long-press / drag to reorder. The list reflects the committed order
// via v-model. Edge autoscroll + clamping come from the core upgrade. A plain tap
// (no drag) must NOT reorder.
const tags = ref(['Design', 'Engineering', 'Product', 'Research', 'Support'])
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- SwipeAction (velocity-aware release) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">SwipeAction</text>
      <text class="text-slate-500 text-xs">Swipe a row left · flick to commit · slow-drag respects threshold.</text>
      <view class="flex flex-col gap-2">
        <VySwipeAction
          v-for="row in mailRows"
          :key="row.id"
          :row-width="300"
          :action-width="80"
          side="right"
        >
          <view class="bg-white h-16 flex flex-col justify-center px-4" :style="{ width: '300px' }">
            <text class="text-slate-900 text-sm font-medium">{{ row.from }}</text>
            <text class="text-slate-500 text-xs">{{ row.subject }}</text>
          </view>
          <template #actions="{ close }">
            <view
              class="bg-rose-500 h-16 flex items-center justify-center"
              :style="{ width: '80px' }"
              @tap="removeRow(row.id); close()"
            >
              <text class="text-white text-sm font-semibold">Delete</text>
            </view>
          </template>
        </VySwipeAction>
      </view>
    </view>

    <!-- Sortable (edge autoscroll + clamping) -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Sortable</text>
      <text class="text-slate-500 text-xs">Drag to reorder · a plain tap should not move a row. Current: {{ tags.join(' · ') }}</text>
      <VySortable v-model="tags">
        <template #item="{ item }">
          <view class="bg-slate-50 border border-slate-200 rounded-md h-11 flex flex-row items-center px-3 mb-2">
            <text class="text-slate-400 text-base mr-3">⠿</text>
            <text class="text-slate-900 text-sm">{{ item }}</text>
          </view>
        </template>
      </VySortable>
    </view>
  </view>
</template>
