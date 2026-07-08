<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme, { iconFg } from '../theme/toggleGroup'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.toggleGroup`.
 */
export const buildToggleGroup = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).toggleGroup as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
})

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
  /** Receives `iconColor` so custom icons can match the item's resolved on/off foreground. */
  default(props: { item: ToggleGroupItemShape & { value: ToggleGroupValue }, index: number, iconColor: string }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { ToggleGroupItem, ToggleGroupRoot, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useColorMode } from '../composables/useColorMode'
import { resolveColorHex } from '../utils/resolveColor'

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

// Lynx SVG can't inherit currentColor, and the `group-ui-on:` shift on
// `leadingIcon` never reaches the rasterized glyph — bake the fill per item
// from the `pressed` state core's Toggle forwards through the item slot
// (same pattern as Button/Tabs). Fallbacks mirror the theme's
// `defaultVariants` (`primary` / `outline`).
const { isDark } = useColorMode()
const itemIconColor = (pressed: boolean | undefined) => {
  const fg = iconFg(props.color ?? 'primary', props.variant ?? 'outline', !!pressed, isDark.value)
  return fg === 'white' ? 'white' : resolveColorHex(appConfig, fg.semantic, fg.shade)
}
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
      v-slot="{ pressed }"
      :value="item.value"
      :disabled="item.disabled"
      :class="ui.item({ class: props.ui?.item })"
    >
      <slot :item="item" :index="index" :icon-color="itemIconColor(pressed)">
        <VyIcon
          v-if="item.icon"
          :name="item.icon"
          :color="itemIconColor(pressed)"
          :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
        />
        <text v-if="item.label" :class="ui.label({ class: props.ui?.label })">{{ item.label }}</text>
      </slot>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
