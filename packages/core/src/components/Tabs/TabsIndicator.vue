<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { ref, watch } from 'vue'
import { useForwardExpose } from '@/shared'
import { useElementRect } from '@/shared/composables'
import { injectTabsRootContext } from './TabsRoot.vue'

export interface TabsIndicatorProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'

const props = defineProps<TabsIndicatorProps>()
const context = injectTabsRootContext()

defineExpose({
  updateIndicatorStyle,
})
useForwardExpose()

interface IndicatorStyle {
  size: number
  position: number
}
// Always start with a zero rect so the `<Primitive>` is mounted on first
// render. On Lynx, swapping the indicator element via `v-if` once the first
// measurement lands has been observed to mis-patch under nested Tabs — keep
// the node alive and just toggle opacity instead.
const indicatorStyle = ref<IndicatorStyle>({
  size: 0,
  position: 0,
})
// The pill stays hidden AND un-transitioned until `ready` — flipped one
// microtask after the first real measurement. One deferral, two jobs: the
// initial `0 → size` commit paints invisibly (no flash at the wrong size), and
// the theme's `transition-[translate,width]` only arms afterwards, so the pill
// never animates growing in from zero on mount / CSS reload — only genuine tab
// switches slide. PrimJS has no `queueMicrotask`; a resolved Promise hops the
// queue (same idiom as `TabsTrigger`'s deferred registration).
const ready = ref(false)

// The list rect only moves on a layout change (or an orientation/dir flip), so
// cache it and re-measure only then. A plain tab switch reuses the cache and
// costs a single trigger `boundingClientRect` round-trip instead of two.
// ponytail: assumes the list rect is stable between `layoutTick` bumps —
// TabsList + TabsTrigger bump it from their own `@layoutchange`, so a list that
// shifts without emitting one would read stale until the next bump.
let cachedListRect: Awaited<ReturnType<typeof useElementRect>> | null = null

/**
 * Measure the active trigger relative to the tabs list via Lynx's
 * `boundingClientRect` (see `useElementRect`). Replaces the prior
 * `querySelectorAll('[role="tab"]')` + `offsetWidth`/`offsetLeft` reads which
 * relied on a DOM that does not exist on Lynx native. `refreshList` re-measures
 * the cached list rect (a layout/orientation/dir change); a tab switch leaves
 * it false and measures only the trigger.
 */
async function updateIndicatorStyle(refreshList = false) {
  const activeValue = context.modelValue.value
  if (activeValue === undefined)
    return

  const triggerEl = context.triggers.value.get(activeValue)
  const listEl = context.tabsList.value
  if (!triggerEl || !listEl)
    return

  if (refreshList || cachedListRect == null)
    cachedListRect = await useElementRect(listEl)
  const listRect = cachedListRect
  const triggerRect = await useElementRect(triggerEl)

  // First paint on Lynx can return a zero rect; skip that frame and wait for
  // the follow-up `@layoutchange` (which bumps `layoutTick` and re-runs us).
  // We still commit if the trigger has at least a non-zero dimension — partial
  // layout (e.g. width measured before height) shouldn't block the indicator.
  if (triggerRect.width === 0 && triggerRect.height === 0 && listRect.width === 0 && listRect.height === 0)
    return

  if (context.orientation.value === 'horizontal') {
    indicatorStyle.value = {
      size: triggerRect.width,
      position: triggerRect.left - listRect.left,
    }
  }
  else {
    indicatorStyle.value = {
      size: triggerRect.height,
      position: triggerRect.top - listRect.top,
    }
  }
  // Real size committed — arm opacity + transition one microtask later so the
  // initial paint neither flashes nor animates.
  if (!ready.value)
    Promise.resolve().then(() => { ready.value = true })
}

// A tab switch moves the trigger but not the list — reuse the cached list rect.
watch(
  () => context.modelValue.value,
  () => { updateIndicatorStyle() },
  { flush: 'post' },
)

// Orientation / direction / `layoutTick` changes can move the list itself, so
// refresh the cached list rect. `layoutTick` is bumped by `TabsList` +
// `TabsTrigger` from their `@layoutchange`; `immediate` drives the first
// measurement once the triggers paint. The triggers map is intentionally NOT a
// watch source: mutating it (from `TabsTrigger`'s deferred registration) used
// to wake this `flush: 'post'` watcher mid-patch under nested Tabs and produce
// `Cannot read property 'parent' of null` from `node-ops.parentNode`. The
// trigger element is read inside `updateIndicatorStyle` instead.
watch(
  () => [
    context.orientation.value,
    context?.dir?.value,
    context.layoutTick.value,
  ],
  () => { updateIndicatorStyle(true) },
  { immediate: true, flush: 'post' },
)

// Lynx native ignores `var()` references that point at custom properties set
// via inline `:style` — see the canonical write-up in
// `core/src/components/Slider/SliderThumbImpl.vue`. Keep size +
// transform as concrete pixel values so the indicator actually paints.
const indicatorInlineStyle = computed(() => {
  const { size, position } = indicatorStyle.value
  // `transitionProperty: 'none'` (inline) overrides the theme class until the
  // pill is `ready`; `undefined` drops the inline value so the class's
  // `transition-[translate,width]` takes over for subsequent switches.
  const transitionProperty = ready.value ? undefined : 'none'
  if (context.orientation.value === 'horizontal') {
    return {
      width: `${size}px`,
      transform: `translateX(${position}px)`,
      opacity: ready.value ? 1 : 0,
      transitionProperty,
    }
  }
  return {
    height: `${size}px`,
    transform: `translateY(${position}px)`,
    opacity: ready.value ? 1 : 0,
    transitionProperty,
  }
})
</script>

<template>
  <Primitive
    v-bind="props"
    :style="indicatorInlineStyle"
  >
    <slot />
  </Primitive>
</template>
