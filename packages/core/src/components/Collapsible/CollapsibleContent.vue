<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface CollapsibleContentProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectCollapsibleRootContext } from './CollapsibleRoot.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<CollapsibleContentProps>()

const rootContext = injectCollapsibleRootContext()
rootContext.contentId ||= useId(undefined, 'vy-collapsible-content')

const { forwardRef } = useForwardExpose()

// With `unmountOnHide` false the content stays in the tree across close with a
// `hidden=""` attribute (as in reka-ui); otherwise it is v-if'd out entirely.
const isOpen = computed(() => rootContext.open.value)
const isHidden = computed(() => !isOpen.value)
const shouldMount = computed(
  () => isOpen.value || !rootContext.unmountOnHide.value,
)

// -- Height morph -------------------------------------------------------------
// Tween the outer container's height between 0 and the content's natural height
// (the device-proven Lynx recipe from `Tray`: MT `setStyleProperty('height')` is
// a no-op, so the height rides an inline px value the consumer's
// `transition-[height]` class interpolates). The inner wrapper is never
// height-constrained, so its `@layoutchange` reports the natural height even
// while the outer clips it to 0.
const measuredHeight = ref<number | null>(null)

function onContentLayout(event: { detail?: { height?: number } } | undefined) {
  const h = event?.detail?.height
  if (typeof h === 'number' && h > 0)
    measuredHeight.value = Math.round(h)
}

// Disarmed for the first paint so a `defaultOpen` panel doesn't animate growing
// in from zero. Same one-tick arm idiom as `TabsIndicator`.
const armed = ref(false)
onMounted(() => { nextTick(() => { armed.value = true }) })

// A fresh open needs a committed `0` baseline before it can tween up, so render
// `0` for one tick when opening, then release to the measured height.
const growingFromZero = ref(false)
watch(isOpen, (open) => {
  if (!open)
    return
  growingFromZero.value = true
  nextTick(() => { growingFromZero.value = false })
})

const contentStyle = computed(() => {
  // `transitionProperty: 'none'` (inline) beats the consumer's
  // `transition-[height]` until armed; `undefined` drops it so the class wins.
  const transitionProperty = armed.value ? undefined : 'none'
  // Closed, or the one-frame open baseline → 0. Open + measured → a concrete px
  // value. Open before the first measure → auto: nothing animates in.
  if (!isOpen.value || growingFromZero.value)
    return { height: '0px', transitionProperty }
  if (measuredHeight.value == null)
    return { transitionProperty }
  return { height: `${measuredHeight.value}px`, transitionProperty }
})

// A close in the DEFAULT unmount mode still snaps — the content is v-if'd out
// the instant `open` flips false, before the collapse can play. Animating it
// needs the leave gated on the height `@transitionend` (keep the node mounted
// through the tween, then unmount), i.e. wrapping this in `Presence` the way
// `SheetContentImpl` does. That changes the synchronous unmount timing every
// current Collapsible/Accordion test (and consumers) rely on, so it's deferred;
// the kept-mounted path (`unmountOnHide: false`) morphs both directions today.
</script>

<template>
  <Primitive
    v-if="shouldMount"
    v-bind="$attrs"
    :id="rootContext.contentId"
    :ref="forwardRef"
    :as-child="props.asChild"
    :as="as"
    :data-state="isOpen ? 'open' : 'closed'"
    :data-disabled="rootContext.disabled?.value ? '' : undefined"
    :hidden="!rootContext.unmountOnHide.value && isHidden ? '' : undefined"
    :style="contentStyle"
  >
    <view @layoutchange="onContentLayout">
      <slot />
    </view>
  </Primitive>
</template>
