<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import type { AcceptableValue } from '@/shared/types'
import { createContext } from '@/shared'

export interface ComboboxItemProps<T = AcceptableValue> extends PrimitiveProps {
  /** The value given when this item is selected. Must not be an empty string. */
  value: T
  /** When `true`, prevents the user from selecting this item. */
  disabled?: boolean
  /**
   * A plain-text representation of the item contents, used for filtering.
   * Required when the children are not plain text.
   */
  textValue?: string
}

export interface ComboboxItemContext {
  isSelected: Ref<boolean>
}

export const [injectComboboxItemContext, provideComboboxItemContext]
  = createContext<ComboboxItemContext>('ComboboxItem')
</script>

<script setup lang="ts" generic="T extends AcceptableValue = AcceptableValue">
import { computed, onMounted, onUnmounted } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useId } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectComboboxGroupContext } from './ComboboxGroup.vue'
import { injectComboboxRootContext } from './ComboboxRoot.vue'

const props = withDefaults(defineProps<ComboboxItemProps<T>>(), {
  as: 'view',
  disabled: false,
})

if (props.value === '') {
  throw new Error(
    'A <ComboboxItem /> must have a value prop that is not an empty string.',
  )
}

const id = useId(undefined, 'vy-combobox-item')
const rootContext = injectComboboxRootContext()
const groupContext = injectComboboxGroupContext(null)

const isSelected = computed(() => rootContext.isValueSelected(props.value))

const isDisabled = computed(() => props.disabled || rootContext.disabled.value)

const a11y = useA11y(() => ({
  role: 'option',
  disabled: isDisabled.value,
  selected: isSelected.value,
}))

const isRender = computed(() => {
  if (rootContext.ignoreFilter.value || !rootContext.filterSearch.value)
    return true
  const matched = rootContext.filterState.value.items.get(id)
  // undefined means the item has not been registered into the filter map yet.
  if (matched === undefined)
    return true
  return matched
})

function itemText(): string {
  if (props.textValue)
    return props.textValue
  if (typeof props.value === 'string')
    return props.value
  if (typeof props.value === 'number' || typeof props.value === 'bigint')
    return String(props.value)
  return ''
}

function handleTap() {
  if (isDisabled.value)
    return
  rootContext.onValueSelect(props.value)
}

onMounted(() => {
  rootContext.allItems.value.set(id, itemText())
  const groupId = groupContext?.id
  if (groupId) {
    const existing = rootContext.allGroups.value.get(groupId)
    if (existing)
      existing.add(id)
    else
      rootContext.allGroups.value.set(groupId, new Set([id]))
  }
})

onUnmounted(() => {
  rootContext.allItems.value.delete(id)
  const groupId = groupContext?.id
  if (groupId)
    rootContext.allGroups.value.get(groupId)?.delete(id)
})

provideComboboxItemContext({ isSelected })
</script>

<template>
  <Primitive
    v-if="isRender"
    :as="as"
    :as-child="asChild"
    :id="id"
    data-vyui-combobox-item=""
    :data-state="isSelected ? 'checked' : 'unchecked'"
    :data-disabled="isDisabled ? '' : undefined"
    :data-highlighted="isSelected ? '' : undefined"
    v-bind="{ ...$attrs, ...a11y }"
    @tap="handleTap"
  >
    <slot>{{ value }}</slot>
  </Primitive>
</template>
