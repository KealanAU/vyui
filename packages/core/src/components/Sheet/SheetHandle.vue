<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->
<script lang="ts">
export interface SheetHandleProps {
  /** Hide the default handle styling. */
  hidden?: boolean
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import type { VyStyle } from '../../shared/types'
import { directionAxis } from '../../shared/composables'
import { injectSheetDragContext, injectSheetRootContext } from './sheetContext'

defineOptions({ inheritAttrs: false })

defineProps<SheetHandleProps>()

const attrs = useAttrs()

// Drag context is provided by SheetContent; null fallback keeps the handle
// renderable standalone (tests).
const drag = injectSheetDragContext(null)

// Root context carries `side`; the null fallback defaults to a bottom-sheet
// horizontal pill.
const root = injectSheetRootContext(null)

// The pill runs perpendicular to the drag axis. SheetContent's per-side
// `flex-direction` floats this first child onto the sheet's inner edge; here we
// only flip the pill's own geometry and its holding margins.
const isVertical = computed(() => directionAxis(root?.side.value ?? 'bottom') === 'x')

// No background here, inline OR as a class: an inline `rgba(0,0,0,…)` vanishes
// on a dark sheet and outranks any consumer class, and a kit token utility is
// meaningless in a headless package. The consumer owns the color.
const mergedStyle = computed<VyStyle>(() => ({
  width: isVertical.value ? '4px' : '36px',
  height: isVertical.value ? '36px' : '4px',
  borderRadius: '2px',
  alignSelf: 'center',
  marginTop: isVertical.value ? '0px' : '8px',
  marginBottom: isVertical.value ? '0px' : '8px',
  marginLeft: isVertical.value ? '8px' : '0px',
  marginRight: isVertical.value ? '8px' : '0px',
  ...(attrs.style as Record<string, any> | undefined),
}))

// Forward the consumer's class alongside our own. `class`/`style` are bound
// explicitly below, so strip them from the attrs spread — binding twice, and
// Lynx's `<view>` class prop rejects the `null` a raw spread would admit.
const forwardedClass = computed(() => ['vyui-sheet__handle', attrs.class as string])
const restAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
</script>

<template>
  <view
    v-if="!hidden"
    data-vyui-sheet-handle
    v-bind="restAttrs"
    :class="forwardedClass"
    :main-thread-bindtouchstart="drag?.handleTouchStartMT"
    :main-thread-bindtouchmove="drag?.handleTouchMoveMT"
    :main-thread-bindtouchend="drag?.handleTouchEndMT"
    :main-thread-bindtouchcancel="drag?.handleTouchEndMT"
    :main-thread-bindmousedown="drag?.handleMouseDownMT"
    :main-thread-bindmousemove="drag?.handleMouseMoveMT"
    :main-thread-bindmouseup="drag?.handleMouseUpMT"
    :style="mergedStyle"
  >
    <slot />
  </view>
</template>
