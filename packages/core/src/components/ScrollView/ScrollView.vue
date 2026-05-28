<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Apache 2.0 licensed, adapted from lynx-family/lynx-ui (Apache 2.0).
     Wraps Lynx's native `<scroll-view>` for mobile-tier scrolling with
     native bounce.

     Pull-to-refresh is **not** supported on this component. Lynx's iOS
     runtime does not register a `refresh-header` UI as a child of
     `<scroll-view>` (crashes with `LynxCreateUIException: refresh-header ui
     not found`), and the `<refresh>` wrapper element used by `<list>` is
     not registered as a generic standalone element either. Consumers that
     need virtualized PTR should use `FeedList`. -->
<script lang="ts">
export interface ScrollViewProps {
  /**
   * Scroll direction.
   * @defaultValue `'vertical'`
   */
  scrollOrientation?: 'vertical' | 'horizontal'
  /**
   * Enable native bounce on iOS / Harmony / PC.
   * @defaultValue `true`
   */
  bounces?: boolean
  /** Disable scrolling. */
  disabled?: boolean
  /**
   * Distance (px) from the upper edge that fires `scrollToUpper`.
   * @defaultValue `0`
   */
  upperThreshold?: number
  /**
   * Distance (px) from the lower edge that fires `scrollToLower`.
   * @defaultValue `0`
   */
  lowerThreshold?: number
  /** Show the native scroll bar. */
  scrollBarEnable?: boolean
}

export type ScrollViewEmits = {
  /** Native `bindscrolltolower` — fires when content nears the lower edge. */
  scrollToLower: [event: unknown]
  /** Native `bindscrolltoupper` — fires when content nears the upper edge. */
  scrollToUpper: [event: unknown]
  /** Native `bindscroll`. */
  scroll: [event: unknown]
  /** Native `bindscrollend`. */
  scrollEnd: [event: unknown]
}
</script>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<ScrollViewProps>(), {
  scrollOrientation: 'vertical',
  bounces: true,
  disabled: false,
  upperThreshold: 0,
  lowerThreshold: 0,
  scrollBarEnable: true,
})

// Mobile-first guidance: touch UX prefers one-axis scroll. `horizontal` stays
// supported (Tabs / Carousel will need it) but is flagged as a non-default
// affordance so callers don't pick it accidentally on phone surfaces.
if (__DEV__ && props.scrollOrientation === 'horizontal') {
  console.warn(
    '[vyui/ScrollView] `scrollOrientation="horizontal"` is a non-default mobile affordance. '
    + 'Touch UX prefers single-axis vertical scroll; consider VyTabs / VySwiper / a paged layout for horizontal flows.',
  )
}

const emits = defineEmits<ScrollViewEmits>()

defineSlots<{
  /** Scrollable content. */
  default?: () => any
}>()

const scrollViewEl = ref<any>(null)

function onScrollToLower(event: unknown): void {
  emits('scrollToLower', event)
}

function onScrollToUpper(event: unknown): void {
  emits('scrollToUpper', event)
}

function onScroll(event: unknown): void {
  emits('scroll', event)
}

function onScrollEnd(event: unknown): void {
  emits('scrollEnd', event)
}

defineExpose({ scrollViewEl })
</script>

<template>
  <scroll-view
    ref="scrollViewEl"
    class="vyui-scroll-view"
    data-vyui-scroll-view
    :scroll-orientation="scrollOrientation"
    :bounces="bounces"
    :enable-scroll="!disabled"
    :scroll-bar-enable="scrollBarEnable"
    :upper-threshold="upperThreshold"
    :lower-threshold="lowerThreshold"
    @scrolltolower="onScrollToLower"
    @scrolltoupper="onScrollToUpper"
    @scroll="onScroll"
    @scrollend="onScrollEnd"
  >
    <slot />
  </scroll-view>
</template>
