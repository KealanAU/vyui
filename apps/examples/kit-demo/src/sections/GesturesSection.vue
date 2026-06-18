<script setup lang="ts">
import { ref } from 'vue'
import { runOnBackground } from 'vue-lynx'
import { VySortable, VySwipeAction } from '@vyui/kit'

// SwipeAction — the upgraded core gesture now uses velocity-aware release, so a
// quick flick opens/commits even on a short drag, while a slow drag respects the
// position threshold. `rowWidth`/`actionWidth` are the px references the core
// primitive snaps against.
// Kept short: the Gestures tab does not page-scroll (so the inner gestures own
// the touch stream), which means both cards must fit on screen without scrolling.
const mailRows = ref([
  { id: 1, from: 'Lynx CI', subject: 'Build #482 passed' },
  { id: 2, from: 'Releases', subject: 'v0.0.6 published' },
])
function removeRow(id: number): void {
  mailRows.value = mailRows.value.filter(r => r.id !== id)
}

// Diagnostic readout — the SwipeAction emits `update:open` on snap and `commit`
// on a full swipe. If dragging a row updates this line, touch events are
// reaching the worklet (so any remaining issue is threshold/snap tuning). If it
// never changes while you drag, the row isn't receiving touchmove at all.
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

// Sortable — drag to reorder; the list reflects the committed order via v-model.
// Demo uses `long-press-ms="0"` (instant lift on press) so a simulator mouse
// click-drag works without holding. Edge autoscroll + clamping come from core.
const tags = ref(['Design', 'Engineering', 'Product', 'Research'])
</script>

<template>
  <view class="flex flex-row flex-wrap flex-1 min-h-0 gap-3">
    <!-- SwipeAction (velocity-aware release) -->
    <view class="bg-white border border-slate-200 rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
      <view class="flex flex-row items-center justify-between">
        <text class="text-slate-900 text-base font-semibold">SwipeAction</text>
        <text class="text-slate-400 text-xs">{{ swipeLog }}</text>
      </view>
      <text class="text-slate-500 text-xs">Full swipe (or flick) deletes · a partial swipe reveals Delete to tap.</text>
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
          <view class="bg-white h-16 flex flex-col justify-center px-4" :style="{ width: `${swipeRowWidth}px` }">
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
    <view class="bg-white border border-slate-200 rounded-lg p-3 flex flex-col flex-1 min-w-[280px] gap-2">
      <text class="text-slate-900 text-base font-semibold">Sortable</text>
      <text class="text-slate-500 text-xs">Press a row and drag to reorder. Current: {{ tags.join(' · ') }}</text>
      <!-- `long-press-ms="0"` = lift immediately on press so a mouse click-drag
           works on the simulator. The Gestures tab disables the outer page
           scroll (see App.vue), so instant drag won't fight page scrolling. -->
      <VySortable v-model="tags" :long-press-ms="0">
        <template #item="{ item }">
          <view class="bg-slate-50 border border-slate-200 rounded-md h-10 flex flex-row items-center px-3 mb-1.5">
            <text class="text-slate-400 text-base mr-3">⠿</text>
            <text class="text-slate-900 text-sm">{{ item }}</text>
          </view>
        </template>
      </VySortable>
    </view>
  </view>
</template>
