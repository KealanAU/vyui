<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     vyui original. Snap / drag logic adapted from `lynx-family/lynx-ui`
     `packages/lynx-ui-sheet/src/hooks/useSnap.ts` + `useDrag.ts` (Apache 2.0). -->
<script lang="ts">
import type { SheetDirection } from '../../shared/composables'

export interface SheetRootProps {
  /** Controlled open state. Bind with `v-model:open`. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /**
   * Controlled current snap index. Bind with `v-model:snapIndex`. Indexes
   * the SORTED `snapPoints` (0 = smallest fraction = most closed). Updated
   * by drag settles; writing it animates the open sheet to that snap.
   */
  snapIndex?: number
  /**
   * Initial snap index when uncontrolled (defaults to 0). The enter
   * animation always slides fully in first; when this points below the
   * largest snap the sheet then settles down to it. The index persists
   * across close/reopen.
   */
  defaultSnapIndex?: number
  /**
   * Edge the sheet is anchored to. Controls enter/exit animation and drag axis.
   * @defaultValue `'bottom'`
   */
  side?: SheetDirection
  /**
   * Snap points as fractions of viewport extent on the sheet axis, low → high.
   * e.g. `[0.25, 0.5, 0.9]`. For `top`/`bottom` this is viewport height;
   * for `left`/`right` this is viewport width.
   * @defaultValue `[1]`
   */
  snapPoints?: number[]
  /**
   * Viewport height in px. If omitted, reads from `SystemInfo.pixelHeight /
   * pixelRatio` at runtime, falling back to `800`.
   */
  viewportHeight?: number
  /**
   * Viewport width in px. If omitted, reads from `SystemInfo.pixelWidth /
   * pixelRatio` at runtime, falling back to `400`.
   */
  viewportWidth?: number
  /**
   * Downward velocity (px/s) at which a fling dismisses from any position
   * (when `enableDragToClose`).
   * @defaultValue `600`
   */
  dismissVelocity?: number
  /**
   * Settle animation duration in ms. Drag release snap-back uses it
   * directly; drag-dismiss and touch-cancel use shorter cuts of it.
   * @defaultValue `280`
   */
  duration?: number
  /**
   * Allow drag below the most-closed snap to dismiss. When `false` with
   * multiple snap points, drag between snaps still works — only the
   * dismiss branch is disabled.
   * @defaultValue `true`
   */
  enableDragToClose?: boolean
  /**
   * Restrict drag interaction to `<SheetHandle>` only. When `true`, the
   * `<SheetContent>` body does not respond to touch.
   * @defaultValue `false`
   */
  handleOnly?: boolean
}

export type SheetRootEmits = {
  'update:open': [value: boolean]
  'update:snapIndex': [value: number]
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { useMainThreadRef } from 'vue-lynx'

import { getViewportSize, useStandardVModelOf } from '../../shared/composables'
import { clamp } from '../../shared/clamp'
import { provideSheetRootContext } from './sheetContext'

const props = withDefaults(defineProps<SheetRootProps>(), {
  defaultOpen: false,
  defaultSnapIndex: 0,
  side: 'bottom',
  snapPoints: () => [1],
  dismissVelocity: 600,
  duration: 280,
  enableDragToClose: true,
  handleOnly: false,
})

const emits = defineEmits<SheetRootEmits>()

defineSlots<{
  default?: (props: { open: boolean, snapIndex: number }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emits)

const snapIndex = useStandardVModelOf<number>(props, 'snapIndex', emits)

const snapPoints = computed(() => {
  if (props.snapPoints.length === 0) return [1]
  return [...props.snapPoints]
    .map(v => clamp(v, 0.01, 1))
    .sort((a, b) => a - b)
})

const viewportHeight = computed(() => {
  if (typeof props.viewportHeight === 'number') return props.viewportHeight
  return getViewportSize()?.height ?? 800
})

const viewportWidth = computed(() => {
  if (typeof props.viewportWidth === 'number') return props.viewportWidth
  return getViewportSize()?.width ?? 400
})

// MT drag progress (1 fully open → 0 dragged to dismiss; only written
// during drag — see sheetContext). Lives at the root so the backdrop can
// read it without injecting through SheetContent.
const progressMTRef = useMainThreadRef<number>(0)
const backdropElRef = useMainThreadRef<any>(null)

// Close does NOT reset snapIndex: the index persists so reopen restores the
// last snap (and a settled v-model value isn't silently rewritten mid-close,
// which would misfire SheetContentImpl's close-time position logic).
function setOpen(next: boolean) {
  if (open.value === next) return
  open.value = next
}

function setSnap(idx: number) {
  const last = snapPoints.value.length - 1
  snapIndex.value = clamp(idx, 0, last)
}

// True only between a drag-dismiss release and the next open — see
// `dragClosing` in sheetContext. Cleared here rather than in SheetContent
// because the panel unmounts on close and the backdrop reads it too.
const dragClosing = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  dragClosing.value = false
  if (snapIndex.value < 0 || snapIndex.value > snapPoints.value.length - 1) {
    snapIndex.value = 0
  }
})

provideSheetRootContext({
  open,
  snapIndex,
  side: computed(() => props.side),
  snapPoints,
  viewportHeight,
  viewportWidth,
  dismissVelocity: computed(() => props.dismissVelocity),
  duration: computed(() => props.duration),
  enableDragToClose: computed(() => props.enableDragToClose),
  handleOnly: computed(() => props.handleOnly),
  setOpen,
  setSnap,
  progressMTRef,
  backdropElRef,
  dragClosing,
})

defineExpose({ setOpen, setSnap })
</script>

<template>
  <slot :open="open" :snap-index="snapIndex" />
</template>
