<script setup lang="ts">
import type { Direction } from '@/shared/types'
import type { SliderOrientationPrivateEmits, SliderOrientationPrivateProps } from './utils'
import { computed, ref, toRefs } from 'vue'
import { useForwardExpose } from '@/shared'
import { getDragPoint, isMouseReleased, useElementRect } from '@/shared/composables'
import SliderImpl from './SliderImpl.vue'
import SliderImplMTS from './SliderImplMTS.vue'
import { injectSliderRootContext } from './SliderRoot.vue'
import { BACK_KEYS, linearScale, provideSliderOrientationContext } from './utils'

interface SliderHorizontalProps extends SliderOrientationPrivateProps {
  dir?: Direction
}

const props = defineProps<SliderHorizontalProps>()
const emits = defineEmits<SliderOrientationPrivateEmits>()
const { max, min, dir, inverted } = toRefs(props)

const rootContext = injectSliderRootContext()
const { forwardRef, currentElement: sliderElement } = useForwardExpose()

const isSlidingFromLeft = computed(() =>(dir?.value !== 'rtl' && !inverted.value) || (dir?.value !== 'ltr' && inverted.value))

type TrackRect = { width: number, left: number }

// Track rect is measured once at slide-start (an async cross-thread query on
// Lynx) and reused for the rest of the drag, so `slideMove` stays synchronous —
// Lynx recycles touch event objects once a handler's sync portion returns.
let dragRect: TrackRect | null = null
const isDragging = ref(false)

function valueFromX(clientX: number, rect: TrackRect): number {
  const input: [number, number] = [0, rect.width]
  const output: [number, number] = isSlidingFromLeft.value ? [min.value, max.value] : [max.value, min.value]
  return linearScale(input, output)(clientX - rect.left)
}

async function handleSlideStart(event: any) {
  // Read the coordinate synchronously, before `await` recycles the event.
  const { x } = getDragPoint(event)
  isDragging.value = true
  const rect = await useElementRect(sliderElement.value)
  // A slideEnd may have landed during the await — bail if the drag is over.
  if (!isDragging.value)
    return
  dragRect = { width: rect.width, left: rect.left }
  emits('slideStart', valueFromX(x, dragRect))
}

function handleSlideMove(event: any, kind: 'touch' | 'mouse') {
  // Lynx web does not reliably deliver `mouseup` — detect release on move.
  if (kind === 'mouse' && isMouseReleased(event)) {
    handleSlideEnd()
    return
  }
  if (!isDragging.value || !dragRect)
    return
  emits('slideMove', valueFromX(getDragPoint(event).x, dragRect))
}

function handleSlideEnd() {
  if (!isDragging.value)
    return
  isDragging.value = false
  dragRect = null
  emits('slideEnd')
}

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
  <!-- MTS path: SliderImplMTS owns touch + paint, commits final value
       directly to SliderRoot via `commitFromMT`. No `slideStart/Move/End`
       emit chain because the BG never sees per-frame deltas. Keyboard
       handlers are a no-op on Lynx native anyway, so they're dropped here. -->
  <SliderImplMTS
    v-if="rootContext.mtsEnabled.value"
    :ref="forwardRef"
    :dir="dir"
    data-orientation="horizontal"
  >
    <slot />
  </SliderImplMTS>
  <SliderImpl
    v-else
    :ref="forwardRef"
    :dir="dir"
    data-orientation="horizontal"
    @slide-start="handleSlideStart"
    @slide-move="handleSlideMove"
    @slide-end="handleSlideEnd"
    @step-key-down="(event) => {
      const slideDirection = isSlidingFromLeft ? 'from-left' : 'from-right';
      const isBackKey = BACK_KEYS[slideDirection].includes(event.key);
      emits('stepKeyDown', event, isBackKey ? -1 : 1)
    }"
    @end-key-down="emits('endKeyDown', $event)"
    @home-key-down="emits('homeKeyDown', $event)"
  >
    <slot />
  </SliderImpl>
</template>
