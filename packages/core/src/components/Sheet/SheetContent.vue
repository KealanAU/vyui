<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Presence wrapper around `SheetContentImpl`. Open / close are driven by
     the `vyui-sheet-slide-in/out` keyframes; the Presence state machine sets
     `ui-entering` / `ui-leaving` on the panel `<view>` and `@animationend`
     (BG-thread event) advances Presence into the `Entered` / `Left` terminal
     states so the panel unmounts only after the slide-out finishes. Drag /
     snap / fling are implemented in SheetContentImpl via MT touch worklets;
     pass `dragDisabled` to opt out. -->
<script lang="ts">
export interface SheetContentProps {
  /** Disable drag / snap / fling; open and close still animate. */
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
