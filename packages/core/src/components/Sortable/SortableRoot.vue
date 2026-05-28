<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Long-press + drag to reorder a vertical list. Gesture
     pipeline lives in SortableItem and runs on the main thread; this root
     owns the v-model array, the per-item registry, and the BG-side commit. -->
<script lang="ts">
export interface SortableRootProps<T = unknown> {
  /** Controlled item ordering. Bind with `v-model`. */
  modelValue?: T[]
  /** Initial ordering when uncontrolled. */
  defaultValue?: T[]
  /**
   * Fixed item height in px. Required — swap math relies on a uniform row size.
   */
  itemHeight: number
  /** Disable all dragging. */
  disabled?: boolean
  /**
   * Long-press activation delay in ms. Set to 0 to drag immediately.
   * @defaultValue 250
   */
  longPressMs?: number
}

export type SortableRootEmits<T = unknown> = {
  'update:modelValue': [value: T[]]
  /** Fires after a drop with the from/to indices. */
  'reorder': [payload: { from: number, to: number }]
  /** Fires when a long-press confirms and the row lifts. */
  'dragStart': [index: number]
  /** Fires after touchend regardless of whether the order changed. */
  'dragEnd': []
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed, ref, watch } from 'vue'
import { useMainThreadRef } from 'vue-lynx'

import { useStandardVModel } from '@/shared/composables'

import type { SortableItemHandle } from './sortableContext'
import { provideSortableRootContext } from './sortableContext'

const props = withDefaults(defineProps<SortableRootProps<T>>(), {
  disabled: false,
  longPressMs: 250,
})

const emits = defineEmits<SortableRootEmits<T>>()

defineSlots<{
  default?: (props: { items: T[] }) => any
}>()

const items = useStandardVModel<T[]>(props, emits, [])

const itemHeight = computed(() => props.itemHeight)
const disabled = computed(() => props.disabled)
const draggingIndex = ref(-1)

// ── MT-shared state ─────────────────────────────────────────────────────────
const itemHandlesMT = useMainThreadRef<SortableItemHandle[]>([])
const itemHeightMT = useMainThreadRef<number>(props.itemHeight)
const disabledMT = useMainThreadRef<boolean>(props.disabled)
const draggingIndexMT = useMainThreadRef<number>(-1)
const longPressMsMT = useMainThreadRef<number>(props.longPressMs)

watch(itemHeight, (v) => { itemHeightMT.current = v })
watch(disabled, (v) => { disabledMT.current = v })
watch(() => props.longPressMs, (v) => { longPressMsMT.current = v })

function register(handle: SortableItemHandle) {
  itemHandlesMT.current = [...itemHandlesMT.current, handle]
  return () => {
    itemHandlesMT.current = itemHandlesMT.current.filter(h => h !== handle)
  }
}

function commitReorder(from: number, to: number) {
  if (from === to || from < 0 || to < 0) return
  const list = [...items.value]
  if (from >= list.length || to >= list.length) return
  const [moved] = list.splice(from, 1)
  list.splice(to, 0, moved)
  items.value = list
  emits('reorder', { from, to })
}

function notifyDragStart(index: number) {
  draggingIndex.value = index
  emits('dragStart', index)
}

function notifyDragEnd() {
  draggingIndex.value = -1
  emits('dragEnd')
}

provideSortableRootContext({
  items,
  itemHeight,
  disabled,
  draggingIndex,
  itemHandlesMT,
  itemHeightMT,
  disabledMT,
  draggingIndexMT,
  longPressMsMT,
  register,
  commitReorder,
  notifyDragStart,
  notifyDragEnd,
} as any)
</script>

<template>
  <view
    class="vyui-sortable"
    data-vyui-sortable-root
    :style="{ display: 'flex', flexDirection: 'column' }"
  >
    <slot :items="items" />
  </view>
</template>
