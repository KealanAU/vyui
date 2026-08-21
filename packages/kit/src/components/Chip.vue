<script lang="ts">
import theme from '../theme/chip'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type ChipTV = ThemeTV<typeof theme>
type ChipVariants = VariantProps<ChipTV>

export interface ChipProps {
  color?: ChipVariants['color']
  size?: ChipVariants['size']
  /** Corner the chip is anchored to. Defaults to `top-right`. */
  position?: ChipVariants['position']
  /** When `true`, keep the chip inside the wrapped element (no edge nudge). */
  inset?: boolean
  /** When `true`, render the dot without the relative wrapper (no overlay). */
  standalone?: boolean
  /** Optional text/count rendered inside the chip — turns the dot into a pill. */
  text?: string | number
  /** Hide the chip itself; the wrapped child still renders. Defaults to `true`. */
  show?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof ChipTV['slots'], ClassValue>>
}

export interface ChipSlots {
  default(props?: {}): any
  content(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<ChipProps>(), {
  inset: false,
  standalone: false,
  show: true,
})
defineSlots<ChipSlots>()
const slots = useSlots()

const hasContent = computed(() => !!slots.content || props.text !== undefined && props.text !== null)

const { ui } = useStyledComponent('chip', theme, () => ({
  color: props.color,
  size: props.size,
  position: props.position,
  inset: props.inset,
  standalone: props.standalone,
  hasContent: hasContent.value,
}))
</script>

<template>
  <template v-if="standalone">
    <view v-if="show" :class="ui.base({ class: [props.class, props.ui?.base] })">
      <slot name="content">
        <text v-if="hasContent" :class="ui.text({ class: props.ui?.text })">{{ props.text }}</text>
      </slot>
    </view>
  </template>
  <view v-else :class="ui.root({ class: [props.class, props.ui?.root] })">
    <slot />
    <view v-if="show" :class="ui.base({ class: props.ui?.base })">
      <slot name="content">
        <text v-if="hasContent" :class="ui.text({ class: props.ui?.text })">{{ props.text }}</text>
      </slot>
    </view>
  </view>
</template>
