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
// Flipped to `true` after the first non-zero measurement so the pill fades in
// instead of flashing at the wrong size/position on first paint.
const hasMeasured = ref(false)

/**
 * Measure the active trigger relative to the tabs list via Lynx's
 * `boundingClientRect` (see `useElementRect`). Replaces the prior
 * `querySelectorAll('[role="tab"]')` + `offsetWidth`/`offsetLeft` reads which
 * relied on a DOM that does not exist on Lynx native.
 */
async function updateIndicatorStyle() {
  const activeValue = context.modelValue.value
  if (activeValue === undefined)
    return

  const triggerEl = context.triggers.value.get(activeValue)
  const listEl = context.tabsList.value
  if (!triggerEl || !listEl)
    return

  const [triggerRect, listRect] = await Promise.all([
    useElementRect(triggerEl),
    useElementRect(listEl),
  ])

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
  hasMeasured.value = true
}

// Re-measure on active value / orientation / direction changes, plus on the
// `layoutTick` that `TabsList` + `TabsTrigger` bump from their
// `@layoutchange`. The triggers map is intentionally NOT a watch source:
// mutating it (from `TabsTrigger`'s deferred registration) used to wake this
// `flush: 'post'` watcher mid-patch under nested Tabs and produce
// `Cannot read property 'parent' of null` from `node-ops.parentNode`. The
// trigger element is read inside `updateIndicatorStyle` instead — the
// layoutchange tick is sufficient to drive the first measurement once the
// triggers paint.
watch(
  () => [
    context.modelValue.value,
    context.orientation.value,
    context?.dir?.value,
    context.layoutTick.value,
  ],
  () => { updateIndicatorStyle() },
  { immediate: true, flush: 'post' },
)

// Lynx native ignores `var()` references that point at custom properties set
// via inline `:style` — see the canonical write-up in
// `core/src/components/Slider/SliderThumbImpl.vue`. Keep size +
// transform as concrete pixel values so the indicator actually paints.
const indicatorInlineStyle = computed(() => {
  const { size, position } = indicatorStyle.value
  if (context.orientation.value === 'horizontal') {
    return {
      width: `${size}px`,
      transform: `translateX(${position}px)`,
      opacity: hasMeasured.value ? 1 : 0,
    }
  }
  return {
    height: `${size}px`,
    transform: `translateY(${position}px)`,
    opacity: hasMeasured.value ? 1 : 0,
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
