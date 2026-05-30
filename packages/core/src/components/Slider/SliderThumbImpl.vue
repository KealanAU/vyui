<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SliderThumbImplProps extends PrimitiveProps {
  index: number
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, onMounted, onUnmounted, useAttrs } from 'vue'
import { useMainThreadRef } from 'vue-lynx'
import { useCollection } from '@/components/Collection'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose, useSize } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectSliderRootContext } from './SliderRoot.vue'
import { convertValueToPercentage, getLabel, getThumbInBoundsOffset, injectSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SliderThumbImplProps>()

const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

const { forwardRef, currentElement: thumbElement } = useForwardExpose()
const { CollectionItem } = useCollection()

const value = computed(() => rootContext.currentModelValue.value[props.index])
const percent = computed(() => value.value === undefined ? 0 : convertValueToPercentage(value.value, rootContext.min.value ?? 0, rootContext.max.value ?? 100))
const label = computed(() => getLabel(props.index, rootContext.currentModelValue.value.length))

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'slider',
  value: { now: value.value ?? null, max: rootContext.max.value ?? 100 },
  label: (attrs['accessibility-label'] as string | undefined) || label.value,
}))
const size = useSize(thumbElement as any)
const orientationSize = computed(() => size[orientation!.size].value)
const thumbInBoundsOffset = computed(() => {
  if (rootContext.thumbAlignment.value === 'overflow' || !orientationSize.value) {
    return 0
  }
  else {
    return getThumbInBoundsOffset(orientationSize.value, percent.value, orientation!.direction.value)
  }
})

// ─── Lynx `var()` restriction — canonical write-up ──────────────────────────
// On Lynx NATIVE, CSS custom properties (`--foo`) set via INLINE `:style=""`
// are not propagated to the element's resolved styles, and any `var(--foo)`
// reference (whether in an inline style on the same element, in a descendant,
// or inside a Tailwind class like `w-(--foo)` / `translate-x-(--foo)`) never
// resolves. The width / transform / colour silently stays at its initial
// value, which usually means the element collapses or paints invisibly.
//
// Stylesheet-level `var()` (declared in a `<style>` block or a `.css` file
// loaded by the consumer) DOES work — that's how `style.css` tokens drive
// `bg-primary-500` etc.
//
// Workaround used across @vyui: skip the custom-property indirection and
// write the concrete value (e.g. `transform: translateX(${px}px)`) straight
// into the inline `:style` of the element that consumes it.
//
// Other components following this pattern: `Tabs/TabsIndicator.vue` (size +
// translate computed inline), `Toast` swipe classes dropped from
// `ui/src/theme/toast.ts`.
//
// reka-ui pipes this thumb position through a `--vy-slider-thumb-transform`
// CSS custom property. We resolve it directly here for the reason above.
// For vertical, the sign flips depending on which edge anchors the thumb so
// an inverted vertical slider (startEdge === 'top') centres correctly.
const thumbTransform = computed(() => {
  if (orientation!.size === 'width')
    return 'translateX(-50%)'
  return orientation!.startEdge.value === 'bottom' ? 'translateY(50%)' : 'translateY(-50%)'
})

const isMounted = useMounted()

// MT-side ref the SliderImplMTS touch worklets paint translate transforms
// onto. Only meaningful when `rootContext.mtsEnabled.value` is true; bound
// unconditionally because `useMainThreadRef` is safe in any environment.
const thumbMTRef = useMainThreadRef<any>(null)
// Plain object that BG can read at mount time. `useMainThreadRef.current` is
// populated during render, so we lift it into a regular ref the registry can
// consume — same pattern Sortable uses (see `SortableItem` styleRef).
const elementHandle: { current: any | null } = { current: null }

onMounted(() => {
  rootContext.thumbElements.value.push(thumbElement.value)
  if (rootContext.mtsEnabled.value) {
    elementHandle.current = (thumbMTRef as unknown as { current: any | null }).current
    rootContext.thumbHandlesMT.current = [
      ...rootContext.thumbHandlesMT.current,
      { index: props.index, elementRef: elementHandle },
    ]
  }
})

onUnmounted(() => {
  const i = rootContext.thumbElements.value.findIndex(i => i === thumbElement.value) ?? -1
  rootContext.thumbElements.value.splice(i, 1)
  if (rootContext.mtsEnabled.value) {
    rootContext.thumbHandlesMT.current = rootContext.thumbHandlesMT.current
      .filter(h => h.elementRef !== elementHandle)
  }
})
</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="{ ...$attrs, ...a11y }"
      :ref="forwardRef"
      :main-thread-ref="rootContext.mtsEnabled.value ? thumbMTRef : undefined"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      :data-orientation="rootContext.orientation.value"
      :as-child="asChild"
      :as="as"
      :style="{
        transform: thumbTransform,
        position: 'absolute',
        [orientation!.startEdge.value]: `calc(${percent}% + ${thumbInBoundsOffset}px)`,
        /**
         * There is no value on the initial render while we resolve the thumb's
         * index, so hide value-less thumbs to avoid a flash at the wrong
         * position before they snap into place once the index is known.
         */
        display: !isMounted && value === undefined ? 'none' : undefined,
      }"
      @focus="() => {
        rootContext.valueIndexToChangeRef.value = index
      }"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
