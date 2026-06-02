<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/toggle'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme (a color
 * builder, invoked with the resolved color list) with user overrides pulled
 * from `appConfig.ui.toggle`.
 */
export const buildToggle = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).toggle as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type ToggleVariants = VariantProps<ReturnType<typeof buildToggle>>

export interface ToggleProps {
  modelValue?: boolean
  disabled?: boolean
  color?: ToggleVariants['color']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
  /** Iconify name rendered inside the toggle when no default slot is supplied. */
  icon?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildToggle>['slots'], any>>
}

export interface ToggleEmits {
  (e: 'update:modelValue', value: boolean): void
}

export interface ToggleSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Toggle as CoreToggle, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: false,
  disabled: false,
})
const emit = defineEmits<ToggleEmits>()
defineSlots<ToggleSlots>()

const appConfig = useAppConfig()
const ui = computed(() => buildToggle(appConfig)({
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
    <slot>
      <VyIcon v-if="icon" :name="icon" :class="ui.icon({ class: props.ui?.icon })" />
    </slot>
  </CoreToggle>
</template>
