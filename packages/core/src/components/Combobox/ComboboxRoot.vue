<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { createContext, useFilter } from '@/shared'

export interface ComboboxRootProps<T = AcceptableValue> extends PrimitiveProps {
  /** The controlled value of the Combobox. Can be bound with `v-model`. */
  modelValue?: T | Array<T>
  /** The value of the combobox when initially rendered. */
  defaultValue?: T | Array<T>
  /** Whether multiple options can be selected. */
  multiple?: boolean
  /** When `true`, prevents the user from interacting with the Combobox. */
  disabled?: boolean
  /** The name of the combobox for form submission. */
  name?: string
  /** When `true`, indicates that the user must select a value. */
  required?: boolean
  /** The controlled open state of the Combobox. Can be bound with `v-model:open`. */
  open?: boolean
  /** The open state of the combobox when it is initially rendered. */
  defaultOpen?: boolean
  /** Whether to reset the searchTerm when the Combobox value is selected. @defaultValue `true` */
  resetSearchTermOnSelect?: boolean
  /** Whether to reset the searchTerm when the Combobox is closed. @defaultValue `true` */
  resetSearchTermOnBlur?: boolean
  /** When `true`, disables the default filtering. */
  ignoreFilter?: boolean
  /** When `true`, the `modelValue` resets to `null` (or `[]` if `multiple`) on clear. */
  resetModelValueOnClear?: boolean
}

export type ComboboxRootEmits<T = AcceptableValue> = {
  /** Event handler called when the value changes. */
  'update:modelValue': [value: T | Array<T>]
  /** Event handler called when the open state changes. */
  'update:open': [value: boolean]
}

export interface ComboboxRootContext<T = AcceptableValue> {
  modelValue: Ref<T | Array<T> | undefined>
  multiple: Ref<boolean>
  disabled: Ref<boolean>
  open: Ref<boolean>
  onOpenChange: (value: boolean) => void
  onValueSelect: (value: T) => void
  filterSearch: Ref<string>
  ignoreFilter: Ref<boolean>
  resetSearchTermOnSelect: Ref<boolean>
  resetSearchTermOnBlur: Ref<boolean>
  resetModelValueOnClear: Ref<boolean>
  allItems: Ref<Map<string, string>>
  allGroups: Ref<Map<string, Set<string>>>
  filterState: ComputedRef<{ count: number, items: Map<string, boolean>, groups: Set<string> }>
  isValueSelected: (value: T) => boolean
}

export const [injectComboboxRootContext, provideComboboxRootContext]
  = createContext<ComboboxRootContext>('ComboboxRoot')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { useVModel } from '@vueuse/core'
import { computed, ref, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useStandardVModelOf } from '@/shared/composables'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ComboboxRootProps<T>>(), {
  as: 'view',
  modelValue: undefined,
  open: undefined,
  multiple: false,
  disabled: false,
  resetSearchTermOnSelect: true,
  resetSearchTermOnBlur: true,
  ignoreFilter: false,
  resetModelValueOnClear: false,
})

const emits = defineEmits<ComboboxRootEmits<T>>()

defineSlots<{
  default?: (props: {
    open: typeof open.value
    modelValue: typeof modelValue.value
  }) => any
}>()

const { multiple, disabled, ignoreFilter, resetSearchTermOnSelect, resetSearchTermOnBlur, resetModelValueOnClear }
  = toRefs(props)

const modelValue = useVModel(props, 'modelValue', emits, {
  // `as any` — useVModel's options type is inferred against the props object
  // rather than the modelValue field, so the generic `T | T[] | undefined`
  // can't be expressed here. Final ref type is reasserted below.
  defaultValue: (props.defaultValue ?? (props.multiple ? [] : undefined)) as any,
  passive: (props.modelValue === undefined) as false,
  deep: true,
}) as Ref<T | T[] | undefined>

const open = useStandardVModelOf<boolean>(props, 'open', emits, false)

const filterSearch = ref('')
const allItems = ref<Map<string, string>>(new Map())
const allGroups = ref<Map<string, Set<string>>>(new Map())

const { contains } = useFilter({ sensitivity: 'base' })

const filterState = computed<{ count: number, items: Map<string, boolean>, groups: Set<string> }>(() => {
  if (!filterSearch.value || ignoreFilter.value) {
    return {
      count: allItems.value.size,
      items: new Map(),
      groups: new Set(allGroups.value.keys()),
    }
  }

  let count = 0
  const items = new Map<string, boolean>()
  const groups = new Set<string>()

  for (const entry of allItems.value) {
    const id = entry[0]
    const text = entry[1]
    const matched = contains(text, filterSearch.value)
    items.set(id, matched)
    if (matched)
      count++
  }

  for (const entry of allGroups.value) {
    const groupId = entry[0]
    const group = entry[1]
    for (const itemId of group) {
      if (items.get(itemId)) {
        groups.add(groupId)
        break
      }
    }
  }

  return { count, items, groups }
})

function valueEquals(a: any, b: any): boolean {
  if (a === b)
    return true
  if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null)
    return JSON.stringify(a) === JSON.stringify(b)
  return false
}

function isValueSelected(value: T): boolean {
  const current = modelValue.value
  if (Array.isArray(current))
    return current.some(v => valueEquals(v, value))
  return valueEquals(current, value)
}

function onOpenChange(value: boolean) {
  if (disabled.value)
    return
  open.value = value
  if (!value && resetSearchTermOnBlur.value)
    filterSearch.value = ''
}

function onValueSelect(value: T) {
  if (disabled.value)
    return

  if (multiple.value) {
    const current = Array.isArray(modelValue.value) ? [...modelValue.value as T[]] : []
    const idx = current.findIndex(v => valueEquals(v, value))
    if (idx >= 0)
      current.splice(idx, 1)
    else
      current.push(value)
    modelValue.value = current
  }
  else {
    modelValue.value = value
    open.value = false
    if (resetSearchTermOnBlur.value)
      filterSearch.value = ''
  }
}

provideComboboxRootContext({
  modelValue,
  multiple,
  disabled,
  open,
  onOpenChange,
  onValueSelect: onValueSelect as (value: AcceptableValue) => void,
  filterSearch,
  ignoreFilter,
  resetSearchTermOnSelect,
  resetSearchTermOnBlur,
  resetModelValueOnClear,
  allItems,
  allGroups,
  filterState,
  isValueSelected: isValueSelected as (value: AcceptableValue) => boolean,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="$attrs"
  >
    <slot
      :open="open"
      :model-value="modelValue"
    />
  </Primitive>
</template>
