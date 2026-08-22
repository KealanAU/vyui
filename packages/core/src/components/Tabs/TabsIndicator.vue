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
// Always start with a zero rect so the `<Primitive>` is mounted on first render:
// swapping the indicator element via `v-if` once the first measurement lands
// mis-patches under nested Tabs. Toggle opacity instead.
const indicatorStyle = ref<IndicatorStyle>({
  size: 0,
  position: 0,
})
// The pill stays hidden AND un-transitioned until `ready`, flipped one microtask
// after the first real measurement: the initial `0 → size` commit paints
// invisibly and the theme's `transition-[translate,width]` only arms afterwards,
// so the pill never animates in from zero. PrimJS has no `queueMicrotask`; a
// resolved Promise hops the queue.
const ready = ref(false)

// The list rect only moves on a layout change (or an orientation/dir flip), so
// cache it and re-measure only then. TabsList and TabsTrigger bump `layoutTick`
// from their own `@layoutchange`; a list that shifts without emitting one reads
// stale until the next bump.
let cachedListRect: Awaited<ReturnType<typeof useElementRect>> | null = null

/**
 * Measure the active trigger relative to the tabs list via Lynx's
 * `boundingClientRect` (see `useElementRect`) — the DOM `offsetWidth`/`offsetLeft`
 * reads it replaces do not exist on Lynx native. `refreshList` re-measures the
 * cached list rect; a tab switch measures only the trigger.
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

  // First paint on Lynx can return a zero rect; skip that frame and wait for the
  // follow-up `@layoutchange`. A partially measured trigger still commits.
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
// refresh the cached rect; `immediate` drives the first measurement once the
// triggers paint. The triggers map is intentionally NOT a watch source: mutating
// it woke this `flush: 'post'` watcher mid-patch under nested Tabs and produced
// `Cannot read property 'parent' of null` from `node-ops.parentNode`.
watch(
  () => [
    context.orientation.value,
    context?.dir?.value,
    context.layoutTick.value,
  ],
  () => { updateIndicatorStyle(true) },
  { immediate: true, flush: 'post' },
)

// Lynx native ignores `var()` references pointing at custom properties set via
// inline `:style` — canonical write-up in `Slider/SliderThumbImpl.vue`. Keep
// size + transform as concrete pixel values.
const indicatorInlineStyle = computed(() => {
  const { size, position } = indicatorStyle.value
  // Inline `transitionProperty: 'none'` overrides the theme class until the pill
  // is `ready`; `undefined` hands control back to the class.
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
