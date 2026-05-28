<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Strategy: pure-CSS slide through the `vyui-sheet-slide-in` /
     `vyui-sheet-slide-out` keyframes (defined in SheetContentImpl's
     `<style>` block). The Presence state machine sets `ui-entering` /
     `ui-leaving` on the panel `<view>`; `@animationend` (BG-thread event)
     advances Presence into the `Entered` / `Left` terminal states so the
     panel unmounts only after the slide-out finishes.

     This deliberately ships open/close-only (no drag / snap / fling). A
     prior MT-rAF based implementation hit a vue-lynx@0.4.0 upstream bug
     around `useMainThreadRef` / `runOnMainThread` ordering — see the
     comment block in SheetContentImpl. Once upstream lands the fix,
     interactivity can be layered back on. -->
<script lang="ts">
export interface SheetContentProps {
  /** Disable dragging. Retained for API parity — no-op in the CSS variant. */
  dragDisabled?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import SheetContentImpl from './SheetContentImpl.vue'
import { injectSheetRootContext } from './sheetContext'

const props = withDefaults(defineProps<SheetContentProps>(), {
  dragDisabled: false,
})

const ctx = injectSheetRootContext()
</script>

<template>
  <Presence :show="ctx.open.value">
    <SheetContentImpl :drag-disabled="props.dragDisabled">
      <slot />
    </SheetContentImpl>
  </Presence>
</template>
