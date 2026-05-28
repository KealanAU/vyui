<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Strategy: CSS-driven fade through the shared `vyui-fade-in` /
     `vyui-fade-out` keyframes (defined in
     `components/Presence/presence.css`, side-effect-imported via the
     `@/components/Presence` entry — see SheetBackdropImpl). The Presence
     state machine sets `ui-entering` / `ui-leaving` on the `<view>`;
     `@animationend` (BG-thread event) advances Presence into the
     `Entered` / `Left` terminal states.

     The MT-side `overlayRef` is still painted by `SheetContent`'s drag
     worklets so the backdrop fades in sync with finger position during a
     drag — independent of the enter/exit keyframe animation here. -->
<script lang="ts">
export interface SheetBackdropProps {
  /** Close the sheet when the backdrop is tapped. @defaultValue `true` */
  dismissOnTap?: boolean
}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import SheetBackdropImpl from './SheetBackdropImpl.vue'
import { injectSheetRootContext } from './sheetContext'

const props = withDefaults(defineProps<SheetBackdropProps>(), {
  dismissOnTap: true,
})

const ctx = injectSheetRootContext()

function onTap() {
  if (!props.dismissOnTap) return
  ctx.setOpen(false)
}
</script>

<template>
  <Presence :show="ctx.open.value">
    <SheetBackdropImpl @tap="onTap" />
  </Presence>
</template>
