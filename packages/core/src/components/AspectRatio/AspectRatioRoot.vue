<script lang="ts">
// Ported from reka-ui (MIT) — https://github.com/unovue/reka-ui
//
// LYNX MECHANISM — uses the native CSS `aspect-ratio` property, NOT reka-ui's
// DOM padding-bottom-percentage hack.
//
// reka-ui's web AspectRatio wraps content in an absolutely-positioned box inside
// a `padding-bottom: (1/ratio)*100%` parent. That hack exists only because older
// browsers lacked `aspect-ratio`. Lynx's layout engine (Starlight, flexbox by
// default) supports the `aspect-ratio` CSS property directly — it is listed as a
// settable property in `@lynx-js/types` (`csstype.d.ts` Property union: `aspectRatio`).
//
// So we render a single `<view>` with `aspect-ratio: <ratio>` and no wrapper:
//   - no `position: absolute`/`inset: 0` content (Lynx percentage padding resolves
//     differently and absolute positioning would fight the default flex layout),
//   - cleaner DOM (one element instead of two),
//   - the element sizes itself to the parent width and derives height from `ratio`.
//
// The default slot still receives `aspect` (the computed 1/ratio*100 percentage)
// to keep the public API identical to reka-ui for ported call-sites.
import type { PrimitiveProps } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

export interface AspectRatioRootProps extends PrimitiveProps {
  /**
   * The desired ratio. Eg: 16/9
   * @defaultValue 1
   */
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
    :data-reka-aspect-ratio="ratio"
    :style="{ aspectRatio: `${ratio}` }"
  >
    <slot :aspect="aspect" />
  </Primitive>
</template>
