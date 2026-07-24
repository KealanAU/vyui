<script setup lang="ts">
import type { SliderOrientationPrivateProps } from './utils'
import { computed, toRefs } from 'vue'
import { useForwardExpose } from '@/shared'
import SliderImplMTS from './SliderImplMTS.vue'
import { provideSliderOrientationContext } from './utils'

interface SliderVerticalProps extends SliderOrientationPrivateProps {}
const props = defineProps<SliderVerticalProps>()
const { inverted } = toRefs(props)

const { forwardRef } = useForwardExpose()

const isSlidingFromBottom = computed(() => !inverted.value)

const startEdge = computed(() => isSlidingFromBottom.value ? 'bottom' : 'top')
const endEdge = computed(() => isSlidingFromBottom.value ? 'top' : 'bottom')
const direction = computed(() => isSlidingFromBottom.value ? 1 : -1)

provideSliderOrientationContext({
  startEdge,
  endEdge,
  direction,
  size: 'height',
})
</script>

<template>
  <SliderImplMTS
    :ref="forwardRef"
    data-orientation="vertical"
  >
    <slot />
  </SliderImplMTS>
</template>
