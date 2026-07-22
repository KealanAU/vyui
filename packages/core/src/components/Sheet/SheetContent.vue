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
  /**
   * Hug content instead of sizing the panel to `snapPoints × viewport`.
   * Forwarded to `SheetContentImpl`. Used by the styled `Tray`.
   * @defaultValue `false`
   */
  fitContent?: boolean
}
</script>

<script setup lang="ts">
import { useAttrs } from 'vue'
import { Presence } from '@/components/Presence'
import { OverlayPortal } from '@/components/OverlayRoot'
import SheetContentImpl from './SheetContentImpl.vue'
import { injectSheetRootContext } from './sheetContext'

// `OverlayPortal` paints its slot through the app-root `<OverlayRoot>` and
// renders NOTHING in place, so there is no root element for `class` / `style`
// to fall through to — they have to be forwarded onto the impl by hand, the
// same way `DialogContentModal` spreads `useAttrs()` into its render. Without
// this, every consumer class on `<SheetContent>` was silently dropped: the kit
// themes' `bg-default` never reached the panel, and core's own hardcoded
// `#fff` / `position: fixed` / `z-index` stood in for them, which is why the
// omission stayed invisible until core stopped shipping color.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<SheetContentProps>(), {
  dragDisabled: false,
  fitContent: false,
})

const attrs = useAttrs()
const ctx = injectSheetRootContext()
</script>

<template>
  <Presence :show="ctx.open.value">
    <OverlayPortal>
      <SheetContentImpl
        v-bind="attrs"
        :drag-disabled="props.dragDisabled"
        :fit-content="props.fitContent"
      >
        <slot />
      </SheetContentImpl>
    </OverlayPortal>
  </Presence>
</template>
