<script setup lang="ts">
import type { StepperRootProps } from '..'
import { StepperDescription, StepperIndicator, StepperItem, StepperRoot, StepperSeparator, StepperTitle, StepperTrigger } from '..'

const props = defineProps<{ stepperProps?: StepperRootProps }>()
const steps = [
  { step: 1, title: 'Address', description: 'Add your address here' },
  { step: 2, title: 'Shipping', description: 'Set your preferred shipping method' },
  { step: 3, title: 'Trade-in', description: 'Add any trade-in items you have' },
  { step: 4, title: 'Payment', description: 'Add any payment information you have' },
  { step: 5, title: 'Checkout', description: 'Confirm your order' },
]
</script>

<template>
  <StepperRoot data-testid="stepper" v-bind="props.stepperProps">
    <StepperItem
      v-for="item in steps"
      :key="item.step"
      :step="item.step"
      :data-testid="`stepper-item-${item.step}`"
    >
      <StepperTrigger :data-testid="`stepper-item-trigger-${item.step}`">
        <StepperIndicator :data-testid="`stepper-item-indicator-${item.step}`" />
        <StepperTitle :data-testid="`stepper-item-title-${item.step}`">
          {{ item.title }}
        </StepperTitle>
        <StepperDescription :data-testid="`stepper-item-description-${item.step}`">
          {{ item.description }}
        </StepperDescription>
      </StepperTrigger>
      <StepperSeparator
        v-if="item.step !== steps[steps.length - 1].step"
        :data-testid="`stepper-item-separator-${item.step}`"
      />
    </StepperItem>
  </StepperRoot>
</template>
