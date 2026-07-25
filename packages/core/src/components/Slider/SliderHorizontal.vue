<script setup lang="ts">
import type { Direction } from '@/shared/types'
import type { SliderOrientationPrivateProps } from './utils'
import { computed, toRefs } from 'vue'
import { useForwardExpose } from '@/shared'
import SliderImplMTS from './SliderImplMTS.vue'
import { provideSliderOrientationContext } from './utils'

interface SliderHorizontalProps extends SliderOrientationPrivateProps {
  dir?: Direction
}

const props = defineProps<SliderHorizontalProps>()
const { dir, inverted } = toRefs(props)

const { forwardRef } = useForwardExpose()

const isSlidingFromLeft = computed(() => (dir?.value !== 'rtl' && !inverted.value) || (dir?.value !== 'ltr' && inverted.value))

const startEdge = computed(() => isSlidingFromLeft.value ? 'left' : 'right')
const endEdge = computed(() => isSlidingFromLeft.value ? 'right' : 'left')
const direction = computed(() => isSlidingFromLeft.value ? 1 : -1)

provideSliderOrientationContext({
  startEdge,
  endEdge,
  direction,
  size: 'width',
})
</script>

<template>
  <SliderImplMTS
    :ref="forwardRef"
    :dir="dir"
    data-orientation="horizontal"
  >
    <slot />
  </SliderImplMTS>
</template>
