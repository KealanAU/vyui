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

// Drag context is provided by SheetContent. Falls back to null when used
// outside a SheetContent (tests), so the handle still renders.
const drag = injectSheetDragContext(null)

// Root context carries `side`. Null fallback keeps the handle renderable
// when mounted standalone (tests) — defaults to a bottom-sheet horizontal pill.
const root = injectSheetRootContext(null)

// The pill runs perpendicular to the drag axis: horizontal for top/bottom
// sheets, vertical for left/right. SheetContent's per-side `flex-direction`
// (column / column-reverse / row / row-reverse) then floats this first child
// onto the sheet's inner edge; here we only flip the pill's own geometry and
// which margins hold it off that edge.
const isVertical = computed(() => directionAxis(root?.side.value ?? 'bottom') === 'x')

// No background here, inline OR as a class. An inline `rgba(0,0,0,…)` would
// vanish on a dark sheet AND outrank any consumer class; core previously
// reached for `bg-accented` instead, which fixed the dark case but hardcoded a
// @vyui/kit token utility into a headless package — meaningless without kit's
// preset, and redundant since all three kit themes already put `bg-accented` on
// their `handle` slot. The consumer owns the color.
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
// explicitly (below), so strip them from the attrs spread to avoid binding
// them twice — and so the element's `class` type stays non-null (Lynx's
// `<view>` class prop rejects `null`, which a raw attrs spread would admit).
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
