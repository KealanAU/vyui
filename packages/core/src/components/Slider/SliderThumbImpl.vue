<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface SliderThumbImplProps extends PrimitiveProps {
  index: number
}
</script>

<script setup lang="ts">
import { useMounted } from '@vueuse/core'
import { computed, useAttrs } from 'vue'

import { useCollection } from '@/components/Collection'
import { Primitive } from '@/components/Primitive'
import type { VyStyle } from '@/shared/types'
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
//
// The sign flips with the anchoring edge. `right: X%` puts the thumb's RIGHT
// edge X% in from the right, so centring it on the value means pulling BACK
// out by half a thumb — the opposite of the `left`-anchored case. Getting this
// wrong is a half-thumb-width offset that only shows up when the slider is
// inverted or RTL: `getThumbInBoundsOffset` would have cancelled it out, but it
// returns 0 on Lynx native, where `useSize` (ResizeObserver / offsetWidth) never
// reports a size.
const thumbTransform = computed(() => {
  if (orientation!.size === 'width')
    return orientation!.startEdge.value === 'right' ? 'translateX(50%)' : 'translateX(-50%)'
  return orientation!.startEdge.value === 'bottom' ? 'translateY(50%)' : 'translateY(-50%)'
})

const isMounted = useMounted()

const thumbStyle = computed<VyStyle>(() => ({
  transform: thumbTransform.value,
  position: 'absolute',
  [orientation!.startEdge.value]: `calc(${percent.value}% + ${thumbInBoundsOffset.value}px)`,
  /**
   * There is no value on the initial render while we resolve the thumb's
   * index, so hide value-less thumbs to avoid a flash at the wrong position
   * before they snap into place once the index is known.
   */
  display: !isMounted.value && value.value === undefined ? 'none' : undefined,
}))

</script>

<template>
  <CollectionItem>
    <Primitive
      v-bind="{ ...$attrs, ...a11y }"
      :ref="forwardRef"
      class="vyui-slider-thumb"
      :data-disabled="rootContext.disabled.value ? '' : undefined"
      :data-orientation="rootContext.orientation.value"
      :as-child="asChild"
      :as="as"
      :style="thumbStyle"
      @focus="() => {
        rootContext.valueIndexToChangeRef.value = index
      }"
    >
      <slot />
    </Primitive>
  </CollectionItem>
</template>
