<script setup lang="ts">
import type { DataOrientation, Direction } from '@/shared/types'
import type { SliderOrientationPrivateProps } from './utils'
import { computed } from 'vue'
import { useForwardExpose } from '@/shared'
import SliderImplMTS from './SliderImplMTS.vue'
import { provideSliderOrientationContext } from './utils'

interface SliderOrientationProps extends SliderOrientationPrivateProps {
  orientation: DataOrientation
  dir?: Direction
}

const props = defineProps<SliderOrientationProps>()

const { forwardRef } = useForwardExpose()

// Vertical sliders fill upwards by default; horizontal ones follow `dir`, which
// `inverted` then flips.
const fromStart = computed(() => props.orientation === 'vertical'
  ? !props.inverted
  : (props.dir !== 'rtl' && !props.inverted) || (props.dir !== 'ltr' && props.inverted))

const edges = computed(() => props.orientation === 'vertical'
  ? ['bottom', 'top'] as const
  : ['left', 'right'] as const)

provideSliderOrientationContext({
  startEdge: computed(() => fromStart.value ? edges.value[0] : edges.value[1]),
  endEdge: computed(() => fromStart.value ? edges.value[1] : edges.value[0]),
})
</script>

<template>
  <SliderImplMTS
    :ref="forwardRef"
    :dir="dir"
    :data-orientation="orientation"
  >
    <slot />
  </SliderImplMTS>
</template>
