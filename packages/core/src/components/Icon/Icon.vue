<script lang="ts">
import type { Component } from 'vue'

export interface IconProps {
  /**
   * Icon to display. Either an Iconify name (`i-lucide-folder`, `lucide:folder`)
   * or a Vue component that renders Lynx elements directly.
   *
   * When `name` is a component it's rendered bare as a pure escape hatch — the
   * primitive does not forward `size`, `color`, or `$attrs` into it. Callers
   * passing a component own its rendering contract.
   */
  name: string | Component
  /**
   * Pixel size applied to both width and height of the resolved SVG. Defaults
   * to `16` — the conventional icon baseline (Lucide / Nuxt UI). This is the
   * one opinionated default on the primitive; override per-call when needed.
   */
  size?: string | number
  /**
   * Color baked into the SVG (replaces `currentColor`). Required to color an
   * icon — Lynx's `<svg>` rasterizes the XML, so `currentColor` can't inherit
   * from a surrounding `<text>` color the way it does in the DOM.
   */
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
 * SVG XML string for the Lynx `<svg>` element. Lynx ships a dedicated `<svg>`
 * that accepts the XML via `content=` (native parses it directly; the web
 * `x-svg` element wraps it in a Blob URL). A `<image>` with a `data:image/svg+xml`
 * URI renders on web but not on iOS/Android, which is why we don't use it.
 *
 * Color is baked into the SVG string because `currentColor` can't be inherited
 * through Lynx's `<svg>` — it rasterizes the XML, the path fill is final.
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
