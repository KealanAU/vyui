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
  /**
   * Edge band in px from the top/bottom of the root within which a drag
   * triggers autoscroll. Set to 0 to disable. Requires the root to be a
   * scroll container (e.g. `scroll-view` / overflow scroll) for any effect.
   * @defaultValue 48
   */
  autoScrollEdge?: number
  /**
   * Max autoscroll speed in px per touchmove frame at the very edge.
   * @defaultValue 12
   */
  autoScrollSpeed?: number
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
import { runOnMainThread, useMainThreadRef } from 'vue-lynx'

import { useStandardVModel } from '@/shared/composables'

import type { SortableItemHandle } from './sortableContext'
import { provideSortableRootContext } from './sortableContext'

const props = withDefaults(defineProps<SortableRootProps<T>>(), {
  disabled: false,
  longPressMs: 250,
  autoScrollEdge: 48,
  autoScrollSpeed: 12,
})

const emits = defineEmits<SortableRootEmits<T>>()

defineSlots<{
  default?: (props: { items: T[] }) => any
}>()

const items = useStandardVModel<T[]>(props, emits, [])

const itemHeight = computed(() => props.itemHeight)
const disabled = computed(() => props.disabled)
const draggingIndex = ref(-1)

const itemHandlesMT = useMainThreadRef<SortableItemHandle[]>([])
const itemHeightMT = useMainThreadRef<number>(props.itemHeight)
const disabledMT = useMainThreadRef<boolean>(props.disabled)
const draggingIndexMT = useMainThreadRef<number>(-1)
const longPressMsMT = useMainThreadRef<number>(props.longPressMs)

const rootRef = useMainThreadRef<any>(null)
const scrollRefMT = useMainThreadRef<any>(null)
const viewportTopMT = useMainThreadRef<number>(0)
const viewportHeightMT = useMainThreadRef<number>(0)
const autoScrollEdgeMT = useMainThreadRef<number>(props.autoScrollEdge)
const autoScrollSpeedMT = useMainThreadRef<number>(props.autoScrollSpeed)

watch(itemHeight, (v) => { itemHeightMT.current = v })
watch(disabled, (v) => { disabledMT.current = v })
watch(() => props.longPressMs, (v) => { longPressMsMT.current = v })
// Config sync — BG writes to MainThreadRef.current are dropped (vue-lynx
// 0.4.0), so push through a setter worklet.
watch(() => props.autoScrollEdge, (v) => { runOnMainThread(_syncAutoScroll as any)(v, props.autoScrollSpeed) })
watch(() => props.autoScrollSpeed, (v) => { runOnMainThread(_syncAutoScroll as any)(props.autoScrollEdge, v) })

function _syncAutoScroll(edge: number, speed: number) {
  'main thread'
  autoScrollEdgeMT.current = edge
  autoScrollSpeedMT.current = speed
}

// Seed the scroll container + viewport metrics on the MT side once the root
// element appears. Bound to `main-thread-binduiappear`; reads the root element
// from its own MT ref. `viewportHeightMT` of 0 keeps autoscroll inert until
// the element reports a size.
function _bindScroll() {
  'main thread'
  const el = (rootRef as any).current
  scrollRefMT.current = el
  if (!el) return
  if (typeof el.getBoundingClientRect === 'function') {
    const r = el.getBoundingClientRect()
    if (r) {
      viewportTopMT.current = r.top ?? 0
      viewportHeightMT.current = r.height ?? (el.clientHeight ?? 0)
      return
    }
  }
  viewportHeightMT.current = el.clientHeight ?? 0
}

// Item registration lives in SortableItem and runs on the MAIN thread: the
// registry is a MainThreadRef and BG writes to `.current` are dropped by
// vue-lynx 0.4.0, so a BG-side `register()` here left the registry empty.

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
  scrollRefMT,
  viewportTopMT,
  viewportHeightMT,
  autoScrollEdgeMT,
  autoScrollSpeedMT,
  commitReorder,
  notifyDragStart,
  notifyDragEnd,
} as any)
</script>

<template>
  <view
    class="vyui-sortable"
    data-vyui-sortable-root
    :main-thread-ref="rootRef"
    :main-thread-binduiappear="_bindScroll"
    :style="{ display: 'flex', flexDirection: 'column' }"
  >
    <slot :items="items" />
  </view>
</template>
