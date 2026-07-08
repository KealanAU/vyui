<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/pinInput'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.pinInput`.
 */
export const buildPinInput = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).pinInput as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
})

type PinInputVariants = VariantProps<ReturnType<typeof buildPinInput>>

export interface PinInputProps {
  /**
   * Controlled value as a flat string. Bridges to the core `PinInputRoot`,
   * which exposes its value as `string[]`.
   */
  modelValue?: string
  /** Number of input boxes rendered. */
  length?: number
  disabled?: boolean
  /** When `true`, inputs render as password fields. */
  mask?: boolean
  /** When `true`, enables one-time-code autofill on mobile. */
  otp?: boolean
  /** Allowed character set for each box. */
  type?: 'numeric' | 'alphanumeric'
  /** Placeholder glyph shown in empty boxes. */
  placeholder?: string
  color?: PinInputVariants['color']
  variant?: PinInputVariants['variant']
  size?: PinInputVariants['size']
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  /** Forwarded to the underlying core control. */
  name?: string
  /** Forwarded to the underlying core control. */
  id?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildPinInput>['slots'], any>>
}

export interface PinInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'complete', value: string): void
}

export interface PinInputSlots {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { PinInputRoot, PinInputInput } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<PinInputProps>(), {
  length: 5,
  type: 'numeric',
  disabled: false,
})
const emit = defineEmits<PinInputEmits>()
defineSlots<PinInputSlots>()

const appConfig = useAppConfig()

// The core root models its value as an array of per-box characters. Mirror the
// flat-string facade by splitting on the way in and joining on the way out.
const normalizedModel = computed<string[] | undefined>(() => {
  if (props.modelValue === undefined) return undefined
  return Array.from(props.modelValue)
})

// Map our `'numeric' | 'alphanumeric'` facade onto the core's `'number' |
// 'text'` distinction. Alphanumeric falls through to free-form text since the
// core only differentiates numeric vs everything-else.
const coreType = computed<'number' | 'text'>(() =>
  props.type === 'numeric' ? 'number' : 'text',
)

const ui = computed(() => buildPinInput(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  highlight: props.highlight,
}))

const onUpdate = (next: string[]) => {
  emit('update:modelValue', next.join(''))
}

const onComplete = (next: string[]) => {
  emit('complete', next.join(''))
}

const boxes = computed(() => Array.from({ length: props.length }, (_, i) => i))
</script>

<template>
  <PinInputRoot
    :model-value="normalizedModel"
    :placeholder="placeholder"
    :mask="mask"
    :otp="otp"
    :type="coreType"
    :disabled="disabled"
    :id="id"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="onUpdate"
    @complete="onComplete"
  >
    <PinInputInput
      v-for="index in boxes"
      :key="index"
      :index="index"
      :class="ui.base({ class: props.ui?.base })"
    />
  </PinInputRoot>
</template>
