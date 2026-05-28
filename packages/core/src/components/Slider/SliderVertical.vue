<script setup lang="ts">
import type { SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { computed, ref, toRefs } from 'vue'
import { useForwardExpose } from '@/shared'
import { getDragPoint, isMouseReleased, useElementRect } from '@/shared/composables'
import SliderImpl from './SliderImpl.vue'
import SliderImplMTS from './SliderImplMTS.vue'
import { injectSliderRootContext } from './SliderRoot.vue'
import { BACK_KEYS, linearScale, provideSliderOrientationContext } from './utils'

interface SliderVerticalProps extends SliderOrientationPrivateProps {}
const props = defineProps<SliderVerticalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const { max, min, inverted } = toRefs(props)

const rootContext = injectSliderRootContext()
const { forwardRef, currentElement: sliderElement } = useForwardExpose()

const isSlidingFromBottom = computed(() => !inverted.value)

type TrackRect = { height: number, top: number }

// Measured once at slide-start, reused for the drag — see SliderHorizontal.
let dragRect: TrackRect | null = null
const isDragging = ref(false)

function valueFromY(clientY: number, rect: TrackRect): number {
  const input: [number, number] = [0, rect.height]
  // Vertical: top edge is max, bottom edge is min (unless inverted).
  const output: [number, number] = isSlidingFromBottom.value ? [max.value, min.value] : [min.value, max.value]
  return linearScale(input, output)(clientY - rect.top)
}

async function handleSlideStart(event: any) {
  const { y } = getDragPoint(event)
  isDragging.value = true
  const rect = await useElementRect(sliderElement.value)
  if (!isDragging.value)
    return
  dragRect = { height: rect.height, top: rect.top }
  emits('slideStart', valueFromY(y, dragRect))
}

function handleSlideMove(event: any, kind: 'touch' | 'mouse') {
  if (kind === 'mouse' && isMouseReleased(event)) {
    handleSlideEnd()
    return
  }
  if (!isDragging.value || !dragRect)
    return
  emits('slideMove', valueFromY(getDragPoint(event).y, dragRect))
}

function handleSlideEnd() {
  if (!isDragging.value)
    return
  isDragging.value = false
  dragRect = null
  emits('slideEnd')
}

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
    v-if="rootContext.mtsEnabled.value"
    :ref="forwardRef"
    data-orientation="vertical"
  >
    <slot />
  </SliderImplMTS>
  <SliderImpl
    v-else
    :ref="forwardRef"
    data-orientation="vertical"
    @slide-start="handleSlideStart"
    @slide-move="handleSlideMove"
    @slide-end="handleSlideEnd"
    @step-key-down="(event) => {
      const slideDirection = isSlidingFromBottom ? 'from-bottom' : 'from-top';
      const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
      emits('stepKeyDown', event, isBackKey ? -1 : 1)
    }"
    @end-key-down="emits('endKeyDown', $event)"
    @home-key-down="emits('homeKeyDown', $event)"
  >
    <slot />
  </SliderImpl>
</template>
