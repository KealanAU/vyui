<script lang="ts">
import theme from '../theme/card'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type CardTV = ThemeTV<typeof theme>
type CardVariants = VariantProps<CardTV>

export interface CardProps {
  variant?: CardVariants['variant']
  class?: any
  ui?: Partial<Record<keyof CardTV['slots'], any>>
}

export interface CardSlots {
  header(props?: {}): any
  default(props?: {}): any
  footer(props?: {}): any
}
</script>

<script setup lang="ts">
import { useSlots } from 'vue'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<CardProps>(), {})
defineSlots<CardSlots>()
const slots = useSlots()

const { ui } = useStyledComponent('card', theme, () => ({
  variant: props.variant,
}))
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <view v-if="!!slots.header" :class="ui.header({ class: props.ui?.header })">
      <slot name="header" />
    </view>
    <view v-if="!!slots.default" :class="ui.body({ class: props.ui?.body })">
      <slot />
    </view>
    <view v-if="!!slots.footer" :class="ui.footer({ class: props.ui?.footer })">
      <slot name="footer" />
    </view>
  </view>
</template>
