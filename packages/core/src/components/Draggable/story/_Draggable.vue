<script setup lang="ts">
import { ref } from 'vue'

import { Draggable, type DraggableProps } from '..'

const props = defineProps<{
  axis?: DraggableProps['axis']
  bounds?: DraggableProps['bounds']
  resetOnEnd?: boolean
  disabled?: boolean
}>()

const lastEnd = ref<{ x: number, y: number, vx: number, vy: number } | null>(null)
const dragCount = ref(0)

function onDragStart() {
  dragCount.value++
}

function onDragEnd(p: { x: number, y: number, vx: number, vy: number }) {
  lastEnd.value = { x: p.x, y: p.y, vx: p.vx, vy: p.vy }
}
</script>

<template>
  <view data-vyui-draggable-story>
    <Draggable
      :axis="props.axis"
      :bounds="props.bounds"
      :reset-on-end="props.resetOnEnd"
      :disabled="props.disabled"
      data-testid="draggable"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
    >
      <template #default="{ dragging }">
        <view
          data-testid="handle"
          :style="{
            width: '100px',
            height: '100px',
            backgroundColor: dragging ? '#1f6feb' : '#999',
            borderRadius: '12px',
          }"
        >
          <text data-testid="dragging">{{ dragging ? 'yes' : 'no' }}</text>
        </view>
      </template>
    </Draggable>
    <text data-testid="drag-count">{{ dragCount }}</text>
    <text data-testid="last-end">{{ lastEnd ? `${lastEnd.x},${lastEnd.y}` : 'none' }}</text>
  </view>
</template>
