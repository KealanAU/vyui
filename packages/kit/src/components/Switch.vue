<script lang="ts">
import theme from '../theme/switch'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type SwitchTV = ThemeTV<typeof theme>
type SwitchVariants = VariantProps<SwitchTV>

export interface SwitchProps {
  modelValue?: boolean
  disabled?: boolean
  /** Forwarded to the underlying core control. */
  name?: string
  /** Forwarded to the underlying core control. */
  id?: string
  /** Forwarded to the underlying core control. */
  required?: boolean
  color?: SwitchVariants['color']
  size?: SwitchVariants['size']
  /** Label text rendered next to the switch. Overridden by the `label` slot. */
  label?: string
  /** Description text rendered below the label. Overridden by the `description` slot. */
  description?: string
  /** Show a loading spinner inside the thumb instead of `checkedIcon`/`uncheckedIcon`. */
  loading?: boolean
  /** Iconify name for the spinner. Defaults to `appConfig.ui.icons.loading`. */
  loadingIcon?: string
  /** Iconify name shown inside the thumb when checked. */
  checkedIcon?: string
  /** Iconify name shown inside the thumb when unchecked. */
  uncheckedIcon?: string
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof SwitchTV['slots'], ClassValue>>
}

export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
}

export interface SwitchSlots {
  label(props?: {}): any
  description(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SwitchRoot, SwitchThumb, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SwitchProps>(), {
  modelValue: false,
  disabled: false,
})
const emit = defineEmits<SwitchEmits>()
defineSlots<SwitchSlots>()

const appConfig = useAppConfig()
const { ui } = useStyledComponent('switch', theme, () => ({
  color: props.color,
  size: props.size,
  checked: props.modelValue,
  disabled: props.disabled,
  highlight: props.highlight,
  loading: props.loading,
}))

const resolvedLoadingIcon = computed(() => props.loadingIcon || appConfig.ui.icons?.loading || 'i-lucide-loader-circle')
</script>

<template>
  <view :class="ui.root({ class: props.ui?.root })">
    <SwitchRoot
      :model-value="modelValue"
      :disabled="disabled"
      :name="name"
      :id="id"
      :required="required"
      :class="ui.base({ class: [props.class, props.ui?.base] })"
      @update:model-value="emit('update:modelValue', $event)"
    >
      <SwitchThumb :class="ui.thumb({ class: props.ui?.thumb })">
        <VyIcon
          v-if="loading"
          :name="resolvedLoadingIcon"
          :class="ui.icon({ class: props.ui?.icon })"
        />
        <VyIcon
          v-else-if="modelValue && checkedIcon"
          :name="checkedIcon"
          :class="ui.icon({ class: props.ui?.icon })"
        />
        <VyIcon
          v-else-if="!modelValue && uncheckedIcon"
          :name="uncheckedIcon"
          :class="ui.icon({ class: props.ui?.icon })"
        />
      </SwitchThumb>
    </SwitchRoot>
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
