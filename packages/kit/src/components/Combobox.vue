<script lang="ts">
/**
 * `VyCombobox` — sheet picker with in-sheet typeahead search.
 *
 * This also covers the **Autocomplete** use case: with `searchable` (default
 * `true`) the search input filters `items` by substring as you type, and the
 * value can only resolve to one of the supplied items. There is no separate
 * `Autocomplete` component — "autocomplete" is Combobox filtering a fixed set,
 * "combobox" is the same control where free-form entry would also be kept.
 * Disable filtering with `:searchable="false"` to get a plain picker.
 */
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/combobox'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.combobox`.
 */
export const buildCombobox = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).combobox as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type ComboboxVariants = VariantProps<ReturnType<typeof buildCombobox>>

/**
 * Item shape — strings/numbers accepted directly; objects pull their
 * value/label off `valueKey`/`labelKey`. `type: 'label'` / `'separator'`
 * render structural rows instead of selectable items.
 */
export interface ComboboxItem {
  label?: string
  /** Iconify name shown in the leading icon slot. */
  icon?: string
  type?: 'label' | 'separator' | 'item'
  value?: string | number
  disabled?: boolean
  [key: string]: any
}

export type ComboboxItems = (ComboboxItem | string | number)[] | (ComboboxItem | string | number)[][]

export interface ComboboxProps {
  /** Items to render — flat array, grouped (array of arrays), or string/number primitives. */
  items?: ComboboxItems
  /** Controlled value. Bind with `v-model`. Array when `multiple` is true. */
  modelValue?: string | number | (string | number)[]
  /** Initial value when uncontrolled. */
  defaultValue?: string | number | (string | number)[]
  /** Trigger placeholder when no value is selected. Also used as the sheet title. */
  placeholder?: string
  /** Placeholder text inside the in-sheet search input. */
  searchPlaceholder?: string
  /** Render the in-sheet search input (`true` by default). */
  searchable?: boolean
  /** Allow selecting more than one item. */
  multiple?: boolean
  disabled?: boolean
  /** Form submission name. Forwarded to the core `ComboboxRoot`. */
  name?: string
  color?: ComboboxVariants['color']
  variant?: ComboboxVariants['variant']
  size?: ComboboxVariants['size']
  /** Paints a static ring matching `color`. */
  highlight?: boolean
  /** Iconify name on the trailing side. Defaults to `appConfig.ui.icons.chevronDown`. */
  trailingIcon?: string
  /** Iconify name shown next to selected items. Defaults to `appConfig.ui.icons.check`. */
  selectedIcon?: string
  /** Iconify name shown in the in-sheet search input. Defaults to `appConfig.ui.icons.search`. */
  searchIcon?: string
  /**
   * Presentation mode — kept for API parity with `VyPopover` /
   * `VyDropdownMenu`. Currently only `'sheet'` is wired (native picker UX);
   * `'anchor'` falls back to sheet today.
   * @defaultValue 'sheet'
   */
  presentation?: 'sheet' | 'anchor'
  /**
   * Snap fractions forwarded to `SheetRoot`. Default `[0.9]` matches a
   * native search-picker — near-full height so the keyboard has room above
   * the search input.
   * @defaultValue `[0.9]`
   */
  snapPoints?: number[]
  /** Controlled current snap index — bind with `v-model:snapIndex`. */
  snapIndex?: number
  /** Initial snap index when uncontrolled. @defaultValue `0` */
  defaultSnapIndex?: number
  /** Show the drag-handle pill at the top of the sheet. @defaultValue `true` */
  handle?: boolean
  /** When `items` are objects, which field to use as the value. */
  valueKey?: string
  /** When `items` are objects, which field to use as the label. */
  labelKey?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildCombobox>['slots'], any>>
}

export interface ComboboxSlots {
  /** Trigger value render override. Defaults to label of the selected item(s). */
  default(props: { modelValue: any, open: boolean }): any
  /** Receives `iconColor` so custom icons can match the trigger's resolved theme color. */
  leading(props: { open: boolean, iconColor: string }): any
  /** Receives `iconColor` so custom icons can match the trigger's resolved theme color. */
  trailing(props: { open: boolean, iconColor: string }): any
  empty(props: { searchTerm?: string }): any
  item(props: { item: ComboboxItem | string | number, index: number }): any
  'item-leading'(props: { item: ComboboxItem | string | number, index: number }): any
  'item-label'(props: { item: ComboboxItem | string | number, index: number }): any
  'item-trailing'(props: { item: ComboboxItem | string | number, index: number }): any
}
</script>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxEmpty,
  ComboboxItem as CoreComboboxItem,
  ComboboxItemIndicator,
  SheetRoot,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { resolveColorHex } from '../utils/resolveColor'

const props = withDefaults(defineProps<ComboboxProps>(), {
  valueKey: 'value',
  labelKey: 'label',
  searchable: true,
  presentation: 'sheet',
  snapPoints: () => [0.9],
  handle: true,
})
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'update:snapIndex': [value: number]
}>()
defineSlots<ComboboxSlots>()

const slots = useSlots()
const appConfig = useAppConfig()

const searchTerm = ref('')

const resolvedTrailingIcon = computed(() => props.trailingIcon || appConfig.ui.icons?.chevronDown || 'i-lucide-chevron-down')
const resolvedSelectedIcon = computed(() => props.selectedIcon || appConfig.ui.icons?.check || 'i-lucide-check')
const resolvedSearchIcon = computed(() => props.searchIcon || appConfig.ui.icons?.search || 'i-lucide-search')

const ui = computed(() => buildCombobox(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  highlight: props.highlight,
  multiple: props.multiple,
  leading: !!slots.leading,
  trailing: true,
}))

// Lynx SVG can't inherit currentColor — bake the resolved hex into icons.
const iconColor = computed(() => resolveColorHex(appConfig, props.color))

// Shared open state bridges `ComboboxRoot` (item-tap closes it; trigger
// toggles it) and `SheetRoot` (drag-to-close, backdrop-tap). Whichever side
// flips it, the other observes through this ref.
const localOpen = ref(false)

// Sheet content unmounts on close, so ComboboxInput's own
// `resetSearchTermOnBlur` watcher never fires — wipe the local term here
// so the next open starts with an empty filter.
watch(localOpen, (open) => {
  if (!open) searchTerm.value = ''
})

const groups = computed<(ComboboxItem | string | number)[][]>(() => {
  if (!props.items?.length) return []
  return Array.isArray(props.items[0]) ? (props.items as (ComboboxItem | string | number)[][]) : [(props.items as (ComboboxItem | string | number)[])]
})
const items = computed(() => groups.value.flatMap(g => g))

const isObjectItem = (item: ComboboxItem | string | number): item is ComboboxItem => typeof item === 'object' && item !== null

const itemValue = (item: ComboboxItem | string | number) => isObjectItem(item) ? item[props.valueKey] : item
const itemLabel = (item: ComboboxItem | string | number): string => isObjectItem(item) ? String(item[props.labelKey] ?? '') : String(item)

const displayLabel = computed(() => {
  const v = props.modelValue
  if (v === undefined || v === null || v === '') return ''
  if (Array.isArray(v)) {
    return v
      .map(val => items.value.find(i => itemValue(i) === val))
      .filter(Boolean)
      .map(i => itemLabel(i as any))
      .join(', ')
  }
  const match = items.value.find(i => itemValue(i) === v)
  return match ? itemLabel(match) : ''
})
</script>

<template>
  <ComboboxRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :open="localOpen"
    :multiple="multiple"
    :disabled="disabled"
    :name="name"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event)"
    @update:open="localOpen = $event"
  >
    <template #default="{ open, modelValue: rootValue }">
      <SheetRoot
        :open="localOpen"
        :snap-points="snapPoints"
        :snap-index="snapIndex"
        :default-snap-index="defaultSnapIndex"
        @update:open="localOpen = $event"
        @update:snap-index="emit('update:snapIndex', $event)"
      >
        <ComboboxTrigger :class="ui.base({ class: props.ui?.base })">
          <view v-if="!!slots.leading" :class="ui.leading({ class: props.ui?.leading })">
            <slot name="leading" :open="open" :icon-color="iconColor" />
          </view>

          <slot :model-value="rootValue" :open="open">
            <text v-if="displayLabel" class="flex-1 min-w-0 truncate text-start text-neutral-900">{{ displayLabel }}</text>
            <text v-else class="flex-1 min-w-0 truncate text-start text-neutral-400">{{ placeholder ?? ' ' }}</text>
          </slot>

          <view :class="ui.trailing({ class: props.ui?.trailing })">
            <slot name="trailing" :open="open" :icon-color="iconColor">
              <VyIcon
                :name="resolvedTrailingIcon"
                :color="iconColor"
                :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
              />
            </slot>
          </view>
        </ComboboxTrigger>

        <SheetBackdrop dismiss-on-tap />
        <SheetContent>
          <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

          <view v-if="placeholder" class="px-4 pt-4 pb-2">
            <text class="text-neutral-500 text-xs font-semibold uppercase">{{ placeholder }}</text>
          </view>

          <view v-if="searchable" class="flex flex-row items-center gap-2 px-3 py-2 border-b border-neutral-200">
            <VyIcon
              :name="resolvedSearchIcon"
              :color="iconColor"
              class="size-5 shrink-0"
            />
            <ComboboxInput
              v-model="searchTerm"
              :placeholder="searchPlaceholder ?? 'Search…'"
              :disabled="disabled"
              :class="ui.input({ class: ['flex-1 min-w-0 bg-transparent text-neutral-900', props.ui?.input] })"
            />
          </view>

          <view class="flex-1 p-2 overflow-y-auto">
            <ComboboxEmpty :class="ui.empty({ class: props.ui?.empty })">
              <slot name="empty" :search-term="searchTerm">
                <text>No results</text>
              </slot>
            </ComboboxEmpty>

            <ComboboxGroup
              v-for="(group, groupIndex) in groups"
              :key="`group-${groupIndex}`"
              :class="ui.group({ class: props.ui?.group })"
            >
              <template v-for="(item, index) in group" :key="`group-${groupIndex}-${index}`">
                <ComboboxLabel
                  v-if="isObjectItem(item) && item.type === 'label'"
                  :class="ui.label({ class: props.ui?.label })"
                >
                  {{ itemLabel(item) }}
                </ComboboxLabel>

                <ComboboxSeparator
                  v-else-if="isObjectItem(item) && item.type === 'separator'"
                  :class="ui.separator({ class: props.ui?.separator })"
                />

                <CoreComboboxItem
                  v-else
                  :class="ui.item({ class: [props.ui?.item, 'px-3 py-3'] })"
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

                    <text :class="ui.itemLabel({ class: props.ui?.itemLabel })">
                      <slot name="item-label" :item="item" :index="index">
                        {{ itemLabel(item) }}
                      </slot>
                    </text>

                    <view :class="ui.itemTrailing({ class: props.ui?.itemTrailing })">
                      <slot name="item-trailing" :item="item" :index="index" />
                      <ComboboxItemIndicator>
                        <VyIcon
                          :name="resolvedSelectedIcon"
                          :class="ui.itemTrailingIcon({ class: props.ui?.itemTrailingIcon })"
                        />
                      </ComboboxItemIndicator>
                    </view>
                  </slot>
                </CoreComboboxItem>
              </template>
            </ComboboxGroup>
          </view>
        </SheetContent>
      </SheetRoot>
    </template>
  </ComboboxRoot>
</template>
