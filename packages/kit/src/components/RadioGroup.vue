<script lang="ts">
import { tv } from 'tailwind-variants'
import theme from '../theme/radioGroup'
import { resolveColors } from '../theme/colors'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type RadioGroupTV = ThemeTV<typeof theme>
type RadioGroupVariants = VariantProps<RadioGroupTV>

export type RadioGroupValue = string | number

export interface RadioGroupItemShape {
  label?: string
  description?: string
  value?: RadioGroupValue
  disabled?: boolean
  [key: string]: any
}

export type RadioGroupItem = RadioGroupItemShape | string | number

export interface RadioGroupProps {
  /** Controlled value. */
  modelValue?: RadioGroupValue
  /** Uncontrolled initial value. */
  defaultValue?: RadioGroupValue
  /** Items to render. String entries are normalised to `{ label, value }`. */
  items?: RadioGroupItem[]
  /** Optional fieldset legend. Overridden by the `legend` slot. */
  legend?: string
  disabled?: boolean
  required?: boolean
  /** Forwarded to the underlying root. */
  name?: string
  /** Forwarded to the underlying root. */
  id?: string
  color?: RadioGroupVariants['color']
  size?: RadioGroupVariants['size']
  orientation?: RadioGroupVariants['orientation']
  class?: any
  ui?: Partial<Record<keyof RadioGroupTV['slots'], any>>
}

export interface RadioGroupEmits {
  (e: 'update:modelValue', value: RadioGroupValue): void
}

export interface RadioGroupSlots {
  legend(props?: {}): any
  label(props: { item: RadioGroupItemShape & { id: string }, modelValue?: RadioGroupValue }): any
  description(props: { item: RadioGroupItemShape & { id: string }, modelValue?: RadioGroupValue }): any
}
</script>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<RadioGroupProps>(), {
  orientation: 'vertical',
  disabled: false,
})
const emit = defineEmits<RadioGroupEmits>()
const slots = defineSlots<RadioGroupSlots>()

const appConfig = useAppConfig()

const groupId = computed(() => props.id ?? useId())

const { ui } = useStyledComponent('radioGroup', theme, () => ({
  color: props.color,
  size: props.size,
  orientation: props.orientation,
  disabled: props.disabled,
  required: props.required,
}))

function normalizeItem(item: RadioGroupItem) {
  if (typeof item === 'string' || typeof item === 'number') {
    return {
      id: `${groupId.value}:${item}`,
      value: item,
      label: String(item),
    } as RadioGroupItemShape & { id: string, value: RadioGroupValue, label: string }
  }
  const value = (item.value ?? item.label) as RadioGroupValue
  return {
    ...item,
    value,
    label: item.label ?? (value !== undefined ? String(value) : ''),
    id: `${groupId.value}:${value}`,
  }
}

const normalizedItems = computed(() => (props.items ?? []).map(normalizeItem))

// `checked` per item drives the per-color compound variant for the active dot.
// Items only differ by (checked × disabled), so the resolved class strings are
// cached per state: an N-item group pays 1–2 tv invocations per render instead
// of 2 slot calls per item (the invocations are the expensive part on Lynx's
// interpreter). The cache rebuilds when the variant-shaping props change; the
// checked/disabled args are read at render time so `modelValue` flips stay
// reactive without invalidating it.
const itemStateUi = computed(() => {
  // This path re-invokes the factory per (checked, disabled) combo, which
  // `useStyledComponent` doesn't expose — rebuild the same per-app factory it
  // uses (identical config → identical output).
  const overrides = (appConfig.ui as Record<string, unknown>).radioGroup as Partial<ReturnType<typeof theme>> | undefined
  const factory = tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
  const { color, size, orientation, ui: uiProp } = props
  const make = (checked: boolean, disabled: boolean) => {
    const invoked = factory({ color, size, orientation, disabled, checked })
    return {
      base: invoked.base({ class: uiProp?.base }),
      indicator: invoked.indicator({ class: uiProp?.indicator }),
    }
  }
  const cache = new Map<string, ReturnType<typeof make>>()
  return (checked: boolean, disabled: boolean) => {
    const key = `${checked}|${disabled}`
    let hit = cache.get(key)
    if (!hit) {
      hit = make(checked, disabled)
      cache.set(key, hit)
    }
    return hit
  }
})

const itemUi = (itemValue: RadioGroupValue, itemDisabled?: boolean) =>
  itemStateUi.value(props.modelValue === itemValue, !!(props.disabled || itemDisabled))
</script>

<template>
  <RadioGroupRoot
    :id="groupId"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :required="required"
    :name="name"
    :orientation="orientation"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event as RadioGroupValue)"
  >
    <view :class="ui.fieldset({ class: props.ui?.fieldset })">
      <text
        v-if="legend || !!slots.legend"
        :class="ui.legend({ class: props.ui?.legend })"
      >
        <slot name="legend">{{ legend }}</slot>
      </text>
      <view
        v-for="item in normalizedItems"
        :key="String(item.value)"
        :class="ui.item({ class: props.ui?.item })"
      >
        <view :class="ui.container({ class: props.ui?.container })">
          <RadioGroupItem
            :id="item.id"
            :value="item.value"
            :disabled="item.disabled"
            :class="itemUi(item.value, item.disabled).base"
          >
            <RadioGroupIndicator
              :class="itemUi(item.value, item.disabled).indicator"
            />
          </RadioGroupItem>
        </view>

        <view :class="ui.wrapper({ class: props.ui?.wrapper })">
          <slot name="label" :item="item" :model-value="modelValue">
            <text v-if="item.label" :class="ui.label({ class: props.ui?.label })">{{ item.label }}</text>
          </slot>
          <slot name="description" :item="item" :model-value="modelValue">
            <text v-if="item.description" :class="ui.description({ class: props.ui?.description })">{{ item.description }}</text>
          </slot>
        </view>
      </view>
    </view>
  </RadioGroupRoot>
</template>
