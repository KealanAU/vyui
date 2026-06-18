<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/select'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.select`.
 */
export const buildSelect = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).select as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type SelectVariants = VariantProps<ReturnType<typeof buildSelect>>

/**
 * Item shape — strings/numbers are accepted directly; objects pull their
 * value/label off the configured `valueKey`/`labelKey`. `type: 'label'` /
 * `'separator'` render structural rows instead of selectable items.
 */
export interface SelectItem {
  label?: string
  /** Iconify name shown in the leading icon slot. */
  icon?: string
  type?: 'label' | 'separator' | 'item'
  value?: string | number
  disabled?: boolean
  [key: string]: any
}

export type SelectItems = (SelectItem | string | number)[] | (SelectItem | string | number)[][]

export interface SelectProps {
  /** Items to render — flat array, grouped (array of arrays), or string/number primitives. */
  items?: SelectItems
  /** Controlled value. Bind with `v-model`. */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  /** Placeholder rendered when no value is selected. Also used as the sheet title. */
  placeholder?: string
  disabled?: boolean
  /** Form submission name. Forwarded to the core `SelectRoot`. */
  name?: string
  color?: SelectVariants['color']
  variant?: SelectVariants['variant']
  size?: SelectVariants['size']
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  /** Iconify name shown on the trailing side of the trigger. Defaults to `appConfig.ui.icons.chevronDown`. */
  trailingIcon?: string
  /** Iconify name rendered next to the selected item. Defaults to `appConfig.ui.icons.check`. */
  selectedIcon?: string
  /**
   * Presentation mode — kept for API parity with `VyPopover` /
   * `VyDropdownMenu`. Currently only `'sheet'` is wired (native picker UX
   * for touch). An `'anchor'` (tablet popper) variant is tracked separately
   * and falls back to `'sheet'` when requested today.
   * @defaultValue 'sheet'
   */
  presentation?: 'sheet' | 'anchor'
  /**
   * Snap fractions forwarded to `SheetRoot`. Default `[0.5]` matches a
   * native picker — half-screen, scrollable list below the placeholder title.
   * @defaultValue `[0.5]`
   */
  snapPoints?: number[]
  /** Show the drag-handle pill at the top of the sheet. @defaultValue `true` */
  handle?: boolean
  /** When `items` are objects, which field to use as the value. */
  valueKey?: string
  /** When `items` are objects, which field to use as the label. */
  labelKey?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildSelect>['slots'], any>>
}

export interface SelectSlots {
  default(props: { modelValue?: string, open: boolean }): any
  /** Receives `iconColor` so custom icons can match the trigger's resolved theme color. */
  leading(props: { modelValue?: string, open: boolean, iconColor: string }): any
  /** Receives `iconColor` so custom icons can match the trigger's resolved theme color. */
  trailing(props: { modelValue?: string, open: boolean, iconColor: string }): any
  item(props: { item: SelectItem | string | number, index: number }): any
  'item-leading'(props: { item: SelectItem | string | number, index: number }): any
  'item-label'(props: { item: SelectItem | string | number, index: number }): any
  'item-trailing'(props: { item: SelectItem | string | number, index: number }): any
}
</script>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectItem as CoreSelectItem,
  SelectItemText,
  SelectItemIndicator,
  SheetRoot,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { resolveColorHex } from '../utils/resolveColor'

const props = withDefaults(defineProps<SelectProps>(), {
  valueKey: 'value',
  labelKey: 'label',
  presentation: 'sheet',
  snapPoints: () => [0.5],
  handle: true,
})
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
defineSlots<SelectSlots>()

const slots = useSlots()
const appConfig = useAppConfig()

const resolvedTrailingIcon = computed(() => props.trailingIcon || appConfig.ui.icons?.chevronDown || 'i-lucide-chevron-down')
const resolvedSelectedIcon = computed(() => props.selectedIcon || appConfig.ui.icons?.check || 'i-lucide-check')

const ui = computed(() => buildSelect(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  highlight: props.highlight,
  leading: !!slots.leading,
  trailing: true,
}))

// Lynx SVG can't inherit currentColor — bake the resolved hex into icons.
// Trigger icons default to neutral (dimmed), decoupled from `color` like the
// border; override via the `leading` / `trailing` slots (they receive this as
// `iconColor`).
const iconColor = computed(() => resolveColorHex(appConfig, 'neutral', 400))

// Shared open state bridges `SelectRoot` (item-tap closes it; SelectTrigger
// toggles it) and `SheetRoot` (drag-to-close, backdrop-tap). Whichever side
// flips it, the other observes through this ref.
const localOpen = ref(false)

const groups = computed<(SelectItem | string | number)[][]>(() => {
  if (!props.items?.length) return []
  return Array.isArray(props.items[0]) ? (props.items as (SelectItem | string | number)[][]) : [(props.items as (SelectItem | string | number)[])]
})
const items = computed(() => groups.value.flatMap(g => g))

const isObjectItem = (item: SelectItem | string | number): item is SelectItem => typeof item === 'object' && item !== null

const itemValue = (item: SelectItem | string | number): string => {
  if (!isObjectItem(item)) return String(item)
  return String(item[props.valueKey] ?? '')
}
const itemLabel = (item: SelectItem | string | number): string => {
  if (!isObjectItem(item)) return String(item)
  return String(item[props.labelKey] ?? '')
}

const displayValue = computed(() => {
  if (props.modelValue === undefined) return ''
  const match = items.value.find(i => itemValue(i) === String(props.modelValue))
  return match ? itemLabel(match) : ''
})
</script>

<template>
  <SelectRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :open="localOpen"
    :disabled="disabled"
    :name="name"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="localOpen = $event"
  >
    <template #default="{ modelValue: rootValue, open }">
      <SheetRoot
        :open="localOpen"
        :snap-points="snapPoints"
        @update:open="localOpen = $event"
      >
        <SelectTrigger :class="ui.base({ class: [props.class, props.ui?.base] })">
          <view v-if="!!slots.leading" :class="ui.leading({ class: props.ui?.leading })">
            <slot name="leading" :model-value="rootValue" :open="open" :icon-color="iconColor" />
          </view>

          <slot :model-value="rootValue" :open="open">
            <text v-if="displayValue" :class="ui.value({ class: props.ui?.value })">{{ displayValue }}</text>
            <text v-else :class="ui.placeholder({ class: props.ui?.placeholder })">{{ placeholder ?? ' ' }}</text>
          </slot>

          <view :class="ui.trailing({ class: props.ui?.trailing })">
            <slot name="trailing" :model-value="rootValue" :open="open" :icon-color="iconColor">
              <VyIcon
                :name="resolvedTrailingIcon"
                :color="iconColor"
                :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
              />
            </slot>
          </view>
        </SelectTrigger>

        <SheetBackdrop dismiss-on-tap />
        <SheetContent :class="ui.content({ class: props.ui?.content })">
          <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

          <view v-if="placeholder" :class="ui.sheetHeader({ class: props.ui?.sheetHeader })">
            <text :class="ui.sheetTitle({ class: props.ui?.sheetTitle })">{{ placeholder }}</text>
          </view>

          <view :class="ui.viewport({ class: props.ui?.viewport })">
            <SelectGroup
              v-for="(group, groupIndex) in groups"
              :key="`group-${groupIndex}`"
              :class="ui.group({ class: props.ui?.group })"
            >
              <template v-for="(item, index) in group" :key="`group-${groupIndex}-${index}`">
                <SelectLabel
                  v-if="isObjectItem(item) && item.type === 'label'"
                  :class="ui.label({ class: props.ui?.label })"
                >
                  {{ itemLabel(item) }}
                </SelectLabel>

                <SelectSeparator
                  v-else-if="isObjectItem(item) && item.type === 'separator'"
                  :class="ui.separator({ class: props.ui?.separator })"
                />

                <CoreSelectItem
                  v-else
                  :class="ui.item({ class: props.ui?.item })"
                  :disabled="isObjectItem(item) && item.disabled"
                  :value="itemValue(item)"
                >
                  <slot name="item" :item="item" :index="index">
                    <slot name="item-leading" :item="item" :index="index">
                      <VyIcon
                        v-if="isObjectItem(item) && item.icon"
                        :name="item.icon"
                        :class="ui.itemLeadingIcon({ class: props.ui?.itemLeadingIcon })"
                      />
                    </slot>

                    <SelectItemText :class="ui.itemLabel({ class: props.ui?.itemLabel })">
                      <slot name="item-label" :item="item" :index="index">
                        {{ itemLabel(item) }}
                      </slot>
                    </SelectItemText>

                    <view :class="ui.itemTrailing({ class: props.ui?.itemTrailing })">
                      <slot name="item-trailing" :item="item" :index="index" />
                      <SelectItemIndicator>
                        <VyIcon
                          :name="resolvedSelectedIcon"
                          :class="ui.itemTrailingIcon({ class: props.ui?.itemTrailingIcon })"
                        />
                      </SelectItemIndicator>
                    </view>
                  </slot>
                </CoreSelectItem>
              </template>
            </SelectGroup>
          </view>
        </SheetContent>
      </SheetRoot>
    </template>
  </SelectRoot>
</template>
