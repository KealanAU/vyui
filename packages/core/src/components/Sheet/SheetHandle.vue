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
import { injectSheetDragContext } from './sheetContext'

defineOptions({ inheritAttrs: false })

defineProps<SheetHandleProps>()

const attrs = useAttrs()

// Drag context is provided by SheetContent. Falls back to null when used
// outside a SheetContent (tests), so the handle still renders.
const drag = injectSheetDragContext(null)

const mergedStyle = computed<VyStyle>(() => ({
  width: '36px',
  height: '4px',
  borderRadius: '2px',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  alignSelf: 'center',
  marginTop: '8px',
  marginBottom: '8px',
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
    :style="mergedStyle"
  >
    <slot />
  </view>
</template>
