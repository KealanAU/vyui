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
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectSliderRootContext } from './SliderRoot.vue'
import { convertValueToPercentage, getLabel, injectSliderOrientationContext } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<SliderThumbImplProps>()

const rootContext = injectSliderRootContext()
const orientation = injectSliderOrientationContext()

const { forwardRef } = useForwardExpose()
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
// ─── Lynx `var()` restriction — canonical write-up ──────────────────────────
// On Lynx NATIVE, CSS custom properties (`--foo`) set via INLINE `:style=""` are
// not propagated to the element's resolved styles, and any `var(--foo)`
// reference — inline, in a descendant, or inside a Tailwind class like
// `w-(--foo)` — never resolves: the value silently stays at its initial, so the
// element collapses or paints invisibly. Stylesheet-level `var()` DOES work,
// which is how `style.css` tokens drive `bg-primary-500`.
//
// Workaround used across @vyui (see also `Tabs/TabsIndicator.vue`): skip the
// custom-property indirection and write the concrete value straight into the
// inline `:style` of the element that consumes it. reka-ui pipes this thumb
// position through a CSS custom property; we resolve it directly.
//
// The sign flips with the anchoring edge: `right: X%` puts the thumb's RIGHT
// edge X% in from the right, so centring means pulling BACK out by half a thumb.
// Getting it wrong is a half-thumb offset visible only when inverted or RTL.
const thumbTransform = computed(() => {
  if (orientation!.size === 'width')
    return orientation!.startEdge.value === 'right' ? 'translateX(50%)' : 'translateX(-50%)'
  return orientation!.startEdge.value === 'bottom' ? 'translateY(50%)' : 'translateY(-50%)'
})

const isMounted = useMounted()

const thumbStyle = computed<VyStyle>(() => ({
  transform: thumbTransform.value,
  position: 'absolute',
  [orientation!.startEdge.value]: `${percent.value}%`,
  /** No value on the initial render while the thumb's index resolves, so hide
   *  value-less thumbs to avoid a flash at the wrong position. */
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
