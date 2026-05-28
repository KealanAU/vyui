<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/toggleGroup'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.toggleGroup`.
 */
export const buildToggleGroup = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).toggleGroup as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type ToggleGroupVariants = VariantProps<ReturnType<typeof buildToggleGroup>>

export type ToggleGroupValue = string | number

export interface ToggleGroupItemShape {
  label?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  value?: ToggleGroupValue
  disabled?: boolean
  [key: string]: any
}

export type ToggleGroupItem = ToggleGroupItemShape | string | number

export interface ToggleGroupProps {
  /** `single` → string | undefined value, `multiple` → array. */
  type?: 'single' | 'multiple'
  /** Controlled value. Array when `type === 'multiple'`. */
  modelValue?: ToggleGroupValue | ToggleGroupValue[]
  /** Uncontrolled initial value. */
  defaultValue?: ToggleGroupValue | ToggleGroupValue[]
  items?: ToggleGroupItem[]
  disabled?: boolean
  color?: ToggleGroupVariants['color']
  variant?: ToggleGroupVariants['variant']
  size?: ToggleGroupVariants['size']
  orientation?: ToggleGroupVariants['orientation']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildToggleGroup>['slots'], any>>
}

export interface ToggleGroupEmits {
  (e: 'update:modelValue', value: ToggleGroupValue | ToggleGroupValue[]): void
}

export interface ToggleGroupSlots {
  default(props: { item: ToggleGroupItemShape & { value: ToggleGroupValue }, index: number }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<ToggleGroupProps>(), {
  type: 'single',
  disabled: false,
  orientation: 'horizontal',
})
const emit = defineEmits<ToggleGroupEmits>()
defineSlots<ToggleGroupSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildToggleGroup(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  orientation: props.orientation,
}))

function normalizeItem(item: ToggleGroupItem) {
  if (typeof item === 'string' || typeof item === 'number') {
    return { value: item, label: String(item) } as ToggleGroupItemShape & { value: ToggleGroupValue }
  }
  const value = (item.value ?? item.label) as ToggleGroupValue
  return { ...item, value, label: item.label ?? String(value) }
}

const normalizedItems = computed(() => (props.items ?? []).map(normalizeItem))
</script>

<template>
  <ToggleGroupRoot
    :type="type"
    :model-value="modelValue as any"
    :default-value="defaultValue as any"
    :disabled="disabled"
    :orientation="orientation"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event as ToggleGroupValue | ToggleGroupValue[])"
  >
    <ToggleGroupItem
      v-for="(item, index) in normalizedItems"
      :key="String(item.value)"
      :value="item.value"
      :disabled="item.disabled"
      :class="ui.item({ class: props.ui?.item })"
    >
      <slot :item="item" :index="index">
        <VyIcon
          v-if="item.icon"
          :name="item.icon"
          :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
        />
        <text v-if="item.label" :class="ui.label({ class: props.ui?.label })">{{ item.label }}</text>
      </slot>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
