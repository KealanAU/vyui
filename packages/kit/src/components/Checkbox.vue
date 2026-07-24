<script lang="ts">
import theme from '../theme/checkbox'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type CheckboxTV = ThemeTV<typeof theme>
type CheckboxVariants = VariantProps<CheckboxTV>

export interface CheckboxProps {
  /** Controlled checked value. `'indeterminate'` renders the mixed state. */
  modelValue?: boolean | 'indeterminate'
  disabled?: boolean
  name?: string
  value?: string
  color?: CheckboxVariants['color']
  size?: CheckboxVariants['size']
  /** Iconify name for the check glyph. Defaults to `appConfig.ui.icons.check`. */
  icon?: string
  /** Iconify name for the indeterminate glyph. Defaults to `appConfig.ui.icons.minus`. */
  indeterminateIcon?: string
  /** Label text rendered next to the checkbox. */
  label?: string
  /** Description text rendered below the label. */
  description?: string
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  /** Forwarded to the underlying CheckboxRoot. */
  id?: string
  /** Forwarded to the underlying CheckboxRoot. */
  required?: boolean
  class?: any
  ui?: Partial<Record<keyof CheckboxTV['slots'], any>>
}

export interface CheckboxEmits {
  (e: 'update:modelValue', value: boolean | 'indeterminate'): void
}

export interface CheckboxSlots {
  label(props?: {}): any
  description(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckboxIndicator, CheckboxRoot, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<CheckboxProps>(), {
  modelValue: false,
  disabled: false,
})
const emit = defineEmits<CheckboxEmits>()
defineSlots<CheckboxSlots>()

const appConfig = useAppConfig()

const resolvedIcon = computed(() => props.icon || appConfig.ui.icons?.check || 'i-lucide-check')
const resolvedIndeterminateIcon = computed(() => props.indeterminateIcon || appConfig.ui.icons?.minus || 'i-lucide-minus')

const { ui } = useStyledComponent('checkbox', theme, () => ({
  color: props.color,
  size: props.size,
  checked: props.modelValue === true || props.modelValue === 'indeterminate',
  disabled: props.disabled,
  highlight: props.highlight,
}))
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <CheckboxRoot
      :model-value="modelValue"
      :disabled="disabled"
      :name="name"
      :value="value"
      :id="id"
      :required="required"
      :class="ui.base({ class: props.ui?.base })"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <CheckboxIndicator :class="ui.indicator({ class: props.ui?.indicator })">
        <VyIcon
          v-if="modelValue === 'indeterminate'"
          :name="resolvedIndeterminateIcon"
          :class="ui.icon({ class: props.ui?.icon })"
        />
        <VyIcon
          v-else
          :name="resolvedIcon"
          :class="ui.icon({ class: props.ui?.icon })"
        />
      </CheckboxIndicator>
    </CheckboxRoot>
    <view
      v-if="label || description || $slots.label || $slots.description"
      :class="ui.wrapper({ class: props.ui?.wrapper })"
    >
      <slot name="label">
        <text v-if="label" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
      </slot>
      <slot name="description">
        <text v-if="description" :class="ui.description({ class: props.ui?.description })">{{ description }}</text>
      </slot>
    </view>
  </view>
</template>
