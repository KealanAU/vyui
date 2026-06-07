<script setup lang="ts">
// Type-lock fixture. Imports a representative spread of `@vyui/core`'s public
// surface — overlay parts, a slider, a form primitive, a label — and exercises
// exported component props and the `VyStyle` style type in typed `:style`
// bindings. It resolves `@vyui/core` through the package's published
// `dist/*.d.ts` (see tsconfig), so any regression in the emitted type surface
// (renamed/removed export, changed prop shape, broken `VyStyle`) fails CI here.
import { computed, ref } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  Label,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  type SliderRootProps,
  type VyStyle,
} from '@vyui/core'

const open = ref(false)
const volume = ref<number>(50)
const quantity = ref<number>(1)

// `computed<VyStyle>` pins the style-object shape to core's published Lynx
// style type. Removing or breaking the `VyStyle` export breaks this check.
const overlayStyle = computed<VyStyle>(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
}))

const contentStyle = computed<VyStyle>(() => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '16px',
  borderRadius: '12px',
  backgroundColor: '#fff',
}))

// Exercise an exported prop type directly so a prop-shape regression surfaces
// independently of the template.
const sliderProps: SliderRootProps = { min: 0, max: 100, step: 1 }
</script>

<template>
  <view>
    <DialogRoot v-model:open="open">
      <DialogTrigger>
        <text>Open</text>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay :style="overlayStyle" />
        <DialogContent :style="contentStyle">
          <DialogTitle>
            <text>Settings</text>
          </DialogTitle>
          <DialogDescription>
            <text>Tune the values below.</text>
          </DialogDescription>

          <Label>
            <text>Volume</text>
          </Label>
          <SliderRoot
            v-model="volume"
            :min="sliderProps.min"
            :max="sliderProps.max"
            :step="sliderProps.step"
          >
            <SliderTrack>
              <SliderRange />
            </SliderTrack>
            <SliderThumb />
          </SliderRoot>

          <Label>
            <text>Quantity</text>
          </Label>
          <NumberFieldRoot v-model="quantity" :min="1">
            <NumberFieldDecrement>
              <text>-</text>
            </NumberFieldDecrement>
            <NumberFieldInput />
            <NumberFieldIncrement>
              <text>+</text>
            </NumberFieldIncrement>
          </NumberFieldRoot>

          <DialogClose>
            <text>Done</text>
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </view>
</template>
