<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     CSS-driven fade through the shared `vyui-fade-in` / `vyui-fade-out`
     keyframes (in `components/Presence/presence.css`). Presence sets
     `ui-entering` / `ui-leaving` on the `<view>` and `@animationend` advances it
     to `Entered` / `Left`.

     The MT-side `overlayRef` is still painted by `SheetContent`'s drag worklets,
     so the backdrop also fades in sync with finger position during a drag. -->
<script lang="ts">
export interface SheetBackdropProps {
  /** Close the sheet when the backdrop is tapped. @defaultValue `true` */
  dismissOnTap?: boolean
}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Presence } from '@/components/Presence'
import { OverlayPortal } from '@/components/OverlayRoot'
import SheetBackdropImpl from './SheetBackdropImpl.vue'
import { injectSheetRootContext } from './sheetContext'

// See `SheetContent` — `OverlayPortal` renders nothing in place, so `class` /
// `style` must be forwarded onto the impl explicitly or the consumer's dim
// class is dropped.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SheetBackdropProps>(), {
  dismissOnTap: true,
})

const attrs = useAttrs()
const ctx = injectSheetRootContext()

function onTap() {
  if (!props.dismissOnTap) return
  ctx.setOpen(false)
}
</script>

<template>
  <Presence :show="ctx.open.value">
    <OverlayPortal>
      <SheetBackdropImpl v-bind="attrs" @tap="onTap" />
    </OverlayPortal>
  </Presence>
</template>
