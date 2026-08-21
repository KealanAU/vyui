<script lang="ts">
import type { Component } from 'vue'

export interface IconProps {
  /**
   * Icon to display: an Iconify name (`i-lucide-folder`, `lucide:folder`) or a
   * Vue component rendering Lynx elements directly. A component is rendered bare
   * as a pure escape hatch — `size`, `color` and `$attrs` are not forwarded into
   * it.
   */
  name: string | Component
  /** Pixel size applied to both width and height of the resolved SVG. Defaults
   *  to `16`, the conventional icon baseline. */
  size?: string | number
  /** Color baked into the SVG (replaces `currentColor`). Required to color an
   *  icon — Lynx's `<svg>` rasterizes the XML, so `currentColor` can't inherit
   *  from a surrounding `<text>` the way it does in the DOM. */
  color?: string
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { resolveIconSvg } from './resolve'

const props = withDefaults(defineProps<IconProps>(), {
  size: 16,
})

// Explicit fallthrough: pin the contract so `:class` reaches the `<svg>` root
// even if a future refactor adds wrapper elements or sets `inheritAttrs: false`.
const attrs = useAttrs()

// Hoisted out of the template: the inline TS union cast (`|`) trips the parser.
const fallthroughClass = computed(
  () => attrs.class as string | Record<string, unknown> | (string | Record<string, unknown>)[],
)

const sizePx = computed(() => {
  const n = typeof props.size === 'number' ? props.size : Number.parseInt(props.size, 10)
  return Number.isFinite(n) ? n : 16
})

/**
 * SVG XML string for the Lynx `<svg>` element, which accepts the XML via
 * `content=` (native parses it directly; the web `x-svg` wraps it in a Blob
 * URL). An `<image>` with a `data:image/svg+xml` URI renders on web but not on
 * iOS/Android. Color is baked into the string because Lynx rasterizes the XML —
 * the path fill is final.
 */
const content = computed(() => {
  if (typeof props.name !== 'string')
    return null
  return resolveIconSvg(props.name, { size: sizePx.value, color: props.color })
})
</script>

<template>
  <component :is="name" v-if="typeof name !== 'string'" />
  <svg
    v-else-if="content"
    :class="fallthroughClass"
    :content="content"
    :style="{ width: `${sizePx}px`, height: `${sizePx}px` }"
  />
</template>
