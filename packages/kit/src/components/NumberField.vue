<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/numberField'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.numberField`.
 */
export const buildNumberField = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).numberField as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type NumberFieldVariants = VariantProps<ReturnType<typeof buildNumberField>>

export interface NumberFieldProps {
  /** Controlled numeric value. `null` (or `undefined`) means empty. */
  modelValue?: number | null
  /** Initial value when uncontrolled. */
  defaultValue?: number | null
  min?: number
  max?: number
  /** Increment/decrement step. Defaults to `1`. */
  step?: number
  disabled?: boolean
  readonly?: boolean
  placeholder?: string
  /** Iconify name for the increment (`+`) button. */
  incrementIcon?: string
  /** Iconify name for the decrement (`-`) button. */
  decrementIcon?: string
  color?: NumberFieldVariants['color']
  variant?: NumberFieldVariants['variant']
  size?: NumberFieldVariants['size']
  /** Forwarded to the underlying input. */
  id?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildNumberField>['slots'], any>>
}

export interface NumberFieldEmits {
  (e: 'update:modelValue', value: number | null): void
}

export interface NumberFieldSlots {
  /** Override the increment button content. */
  increment(props: { iconColor: string }): any
  /** Override the decrement button content. */
  decrement(props: { iconColor: string }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NumberFieldRoot,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { resolveColorHex } from '../utils/resolveColor'

const props = withDefaults(defineProps<NumberFieldProps>(), {
  step: 1,
})
const emit = defineEmits<NumberFieldEmits>()
defineSlots<NumberFieldSlots>()

const appConfig = useAppConfig()

const resolvedIncrementIcon = computed(() => props.incrementIcon || appConfig.ui.icons?.plus || 'i-lucide-plus')
const resolvedDecrementIcon = computed(() => props.decrementIcon || appConfig.ui.icons?.minus || 'i-lucide-minus')

// Lynx SVG can't inherit currentColor — bake the resolved hex into the icon.
// Increment/decrement icons default to neutral (dimmed), decoupled from
// `color` like the border; override via the `increment` / `decrement` slots
// (they receive this as `iconColor`).
const iconColor = computed(() => resolveColorHex(appConfig, 'neutral', 400))

const ui = computed(() => buildNumberField(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
}))
</script>

<template>
  <NumberFieldRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :readonly="readonly"
    :id="id"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="(v: number | null) => emit('update:modelValue', v)"
  >
    <NumberFieldDecrement :class="ui.decrement({ class: props.ui?.decrement })">
      <slot name="decrement" :icon-color="iconColor">
        <VyIcon
          :name="resolvedDecrementIcon"
          :color="iconColor"
          :class="ui.decrementIcon({ class: props.ui?.decrementIcon })"
        />
      </slot>
    </NumberFieldDecrement>
    <NumberFieldInput
      :placeholder="placeholder"
      :class="ui.base({ class: ['w-full', props.ui?.base] })"
    />
    <NumberFieldIncrement :class="ui.increment({ class: props.ui?.increment })">
      <slot name="increment" :icon-color="iconColor">
        <VyIcon
          :name="resolvedIncrementIcon"
          :color="iconColor"
          :class="ui.incrementIcon({ class: props.ui?.incrementIcon })"
        />
      </slot>
    </NumberFieldIncrement>
  </NumberFieldRoot>
</template>
