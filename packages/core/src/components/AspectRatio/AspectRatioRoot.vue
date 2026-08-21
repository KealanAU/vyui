<script lang="ts">
// Constrains content to a fixed width-to-height ratio.
//
// Lynx's layout engine (Starlight, flexbox by default) supports the `aspect-ratio`
// CSS property directly — it is a settable property in `@lynx-js/types`
// (`csstype.d.ts` Property union: `aspectRatio`). So we render a single `<view>`
// with `aspect-ratio: <ratio>` and no wrapper:
//   - no `position: absolute`/`inset: 0` content (percentage padding resolves
//     against parent width and absolute positioning would fight the default flex
//     layout),
//   - cleaner DOM (one element instead of two),
//   - the element sizes itself to the parent width and derives height from `ratio`.
//
// `aspect-ratio` only derives the missing dimension when ONE dimension is
// definite. Browsers infer a stretched element's width as definite; Lynx's
// layout engine does not, so a width-less box can't solve its height and falls
// back to content height. We therefore default `width: 100%` (fills the
// container, the common case) — override `width` if you instead want to size by
// a fixed height and derive width.
//
// The default slot still receives `aspect` (the computed 1/ratio*100 percentage)
// for call-sites that want the raw percentage.
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface AspectRatioRootProps extends PrimitiveProps {
  /** The desired ratio. Eg: 16/9 @defaultValue 1 */
  ratio?: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<AspectRatioRootProps>(), {
  ratio: 1,
  as: 'view',
})

defineSlots<{
  default?: (props: {
    /** Current aspect ratio (in %) */
    aspect: typeof aspect.value
  }) => any
}>()

const { forwardRef } = useForwardExpose()

const aspect = computed(() => (1 / props.ratio) * 100)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-vyui-aspect-ratio="ratio"
    :style="{ width: '100%', aspectRatio: `${ratio}` }"
  >
    <slot :aspect="aspect" />
  </Primitive>
</template>
