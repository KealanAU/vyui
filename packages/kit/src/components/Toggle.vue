<script lang="ts">
import theme from '../theme/toggle'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type ToggleTV = ThemeTV<typeof theme>
type ToggleVariants = VariantProps<ToggleTV>

export interface ToggleProps {
  modelValue?: boolean
  disabled?: boolean
  color?: ToggleVariants['color']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
  /** Iconify name rendered inside the toggle when no default slot is supplied. */
  icon?: string
  class?: any
  ui?: Partial<Record<keyof ToggleTV['slots'], any>>
}

export interface ToggleEmits {
  (e: 'update:modelValue', value: boolean): void
}

export interface ToggleSlots {
  /** Pressed state and disabled flag forwarded from the core primitive. */
  default(props: {
    /** Current value */
    modelValue: boolean
    /** Current state */
    state: 'on' | 'off'
    /** Current pressed state */
    pressed: boolean
    /** Current disabled state */
    disabled: boolean
  }): any
}
</script>

<script setup lang="ts">
import { Toggle as CoreToggle, Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: false,
  disabled: false,
})
const emit = defineEmits<ToggleEmits>()
defineSlots<ToggleSlots>()

const { ui } = useStyledComponent('toggle', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  pressed: props.modelValue,
}))
</script>

<template>
  <CoreToggle
    :model-value="modelValue"
    :disabled="disabled"
    :class="ui.base({ class: [props.class, props.ui?.base] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot
      :model-value="modelValue"
      :state="modelValue ? 'on' : 'off'"
      :pressed="modelValue"
      :disabled="disabled"
    >
      <VyIcon v-if="icon" :name="icon" :class="ui.icon({ class: props.ui?.icon })" />
    </slot>
  </CoreToggle>
</template>
