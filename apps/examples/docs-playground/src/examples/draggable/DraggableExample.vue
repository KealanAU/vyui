<script setup lang="ts">
import { ref } from 'vue'
import { Draggable } from '@vyui/core'

// Play area = bounds + block size (2*180+64 x 2*110+64), so the block's edges
// land exactly on the dashed border.
const BOUNDS = { left: -180, right: 180, top: -110, bottom: 110 }

const hitEdge = ref(false)
let clearTimer: ReturnType<typeof setTimeout> | undefined

function onDragMove({ x, y }: { x: number, y: number }) {
  if (x <= BOUNDS.left || x >= BOUNDS.right || y <= BOUNDS.top || y >= BOUNDS.bottom) {
    hitEdge.value = true
    clearTimeout(clearTimer)
    clearTimer = setTimeout(() => (hitEdge.value = false), 300)
  }
}
</script>

<template>
  <view class="flex h-full w-full items-center justify-center">
    <view
      class="flex h-[284px] w-[424px] items-center justify-center rounded-xl border border-dashed"
      :class="hitEdge ? 'border-red-500' : 'border-neutral-300'"
    >
      <Draggable :bounds="BOUNDS" emit-move @drag-move="onDragMove">
        <template #default="{ dragging }">
          <view
            class="flex size-16 items-center justify-center rounded-xl"
            :class="dragging ? 'bg-primary' : 'bg-neutral-400'"
          >
            <text class="text-xs text-white">drag</text>
          </view>
        </template>
      </Draggable>
    </view>
  </view>
</template>
