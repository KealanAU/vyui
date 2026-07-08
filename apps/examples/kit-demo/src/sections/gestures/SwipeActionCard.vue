<script setup lang="ts">
import { ref } from 'vue'
import { runOnBackground } from 'vue-lynx'
import { VySwipeAction } from '@vyui/kit'

// SwipeAction — velocity-aware release: a quick flick opens/commits even on a
// short drag, while a slow drag respects the position threshold. `rowWidth` /
// `actionWidth` are the px references the core primitive snaps against.
const mailRows = ref([
  { id: 1, from: 'Lynx CI', subject: 'Build #482 passed' },
  { id: 2, from: 'Releases', subject: 'v0.0.6 published' },
])
function removeRow(id: number): void {
  mailRows.value = mailRows.value.filter(r => r.id !== id)
}

// Diagnostic readout — `update:open` fires on snap, `commit` on a full swipe. If
// this line changes while you drag, touches are reaching the worklet (so any
// remaining issue is threshold/snap tuning); if it never moves, the row isn't
// receiving touchmove at all.
const swipeLog = ref('(no swipe yet)')
const swipeRowWidth = ref(300)

function updateSwipeRowWidth(width: number): void {
  swipeRowWidth.value = Math.max(220, Math.round(width))
}
function onSwipeLayoutChange(e: any): void {
  'main thread'
  const width = e?.detail?.width ?? e?.params?.width
  if (typeof width === 'number') runOnBackground(updateSwipeRowWidth as any)(width)
}
function onSwipeOpen(id: number, open: boolean): void {
  swipeLog.value = `row ${id}: ${open ? 'opened' : 'closed'}`
}
function onSwipeCommit(id: number): void {
  // A full swipe past the commit threshold is the destructive action — delete
  // the row (iOS-mail style). A partial swipe instead reveals the Delete button
  // to tap (see the `#actions` slot).
  swipeLog.value = `row ${id}: committed → deleted`
  removeRow(id)
}
</script>

<template>
  <view class="bg-default border border-neutral-200 rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
    <view class="flex flex-row items-center justify-between">
      <text class="text-neutral-900 text-base font-semibold">SwipeAction</text>
      <text class="text-neutral-400 text-xs">{{ swipeLog }}</text>
    </view>
    <text class="text-neutral-500 text-xs">Full swipe (or flick) deletes · a partial swipe reveals Delete to tap.</text>
    <view
      class="flex flex-col w-full gap-2"
      :main-thread-bindlayoutchange="onSwipeLayoutChange"
    >
      <VySwipeAction
        v-for="row in mailRows"
        :key="row.id"
        :row-width="swipeRowWidth"
        :action-width="80"
        side="right"
        @update:open="(o: boolean) => onSwipeOpen(row.id, o)"
        @commit="onSwipeCommit(row.id)"
      >
        <view class="bg-default h-16 flex flex-col justify-center px-4" :style="{ width: `${swipeRowWidth}px` }">
          <text class="text-neutral-900 text-sm font-medium">{{ row.from }}</text>
          <text class="text-neutral-500 text-xs">{{ row.subject }}</text>
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
</template>
