<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export type SliderImplEmits = {
  /** Pointer began on the track — payload is the raw Lynx touch/mouse event. */
  slideStart: [event: any]
  /**
   * Pointer moved while sliding. `kind` lets the orientation layer run the
   * `isMouseReleased` check on Lynx web (no reliable `mouseup` to JS).
   */
  slideMove: [event: any, kind: 'touch' | 'mouse']
  /** Touch ended / cancelled / mouse released. */
  slideEnd: []
  homeKeyDown: [event: KeyboardEvent]
  endKeyDown: [event: KeyboardEvent]
  stepKeyDown: [event: KeyboardEvent]
}

export interface SliderImplProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<SliderImplProps>(), {
  // Lynx has no `<span>`; the track is a plain view.
  as: 'view',
})
const emits = defineEmits<SliderImplEmits>()
</script>

<template>
  <!--
    Lynx fires `touchstart`/`touchmove`/`touchend` — never DOM pointer events.
  -->
  <Primitive
    data-slider-impl
    v-bind="props"
    @touchstart="(event: any) => emits('slideStart', event)"
    @touchmove="(event: any) => emits('slideMove', event, 'touch')"
    @touchend="() => emits('slideEnd')"
    @touchcancel="() => emits('slideEnd')"
  >
    <slot />
  </Primitive>
</template>
