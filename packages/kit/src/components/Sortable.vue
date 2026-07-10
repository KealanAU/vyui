<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/sortable'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.sortable`.
 */
export const buildSortable = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).sortable as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
})

type SortableVariants = VariantProps<ReturnType<typeof buildSortable>>

export interface SortableProps<T = unknown> {
  /** Controlled ordered items. Bind with `v-model`. */
  modelValue?: T[]
  /** Disable dragging on every row. */
  disabled?: boolean
  /**
   * How long (ms) a press must be held before a row lifts for dragging. The
   * hold guards against a tap or a scroll being mistaken for a drag. Set `0`
   * for immediate drag (e.g. when the list is not inside a scroller).
   * @defaultValue `250`
   */
  longPressMs?: number
  size?: SortableVariants['size']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildSortable>['slots'], any>>
}

export interface SortableEmits<T = unknown> {
  (e: 'update:modelValue', value: T[]): void
}

export interface SortableSlots<T = unknown> {
  item?(props: { item: T, index: number }): any
}
</script>

<script setup lang="ts" generic="T = unknown">
import { computed } from 'vue'
import { SortableRoot, SortableItem } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<SortableProps<T>>(), {
  disabled: false,
})
const emit = defineEmits<SortableEmits<T>>()
defineSlots<SortableSlots<T>>()

const appConfig = useAppConfig()

const ui = computed(() => buildSortable(appConfig)({
  size: props.size,
  disabled: props.disabled,
}))

// Pixel item heights mirror the size variant padding so the MT swap math in
// SortableItem lines up with the rendered row geometry.
const ITEM_HEIGHTS = { sm: 40, md: 52, lg: 68 } as const

const itemHeight = computed(() => ITEM_HEIGHTS[(props.size ?? 'md') as keyof typeof ITEM_HEIGHTS])
</script>

<template>
  <SortableRoot
    :model-value="modelValue"
    :item-height="itemHeight"
    :disabled="disabled"
    :long-press-ms="longPressMs"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="(v: T[]) => emit('update:modelValue', v)"
  >
    <SortableItem
      v-for="(it, index) in modelValue"
      :key="index"
      :index="index"
      :class="ui.item({ class: props.ui?.item })"
    >
      <!-- The pill is a child of the transformed shell so the shell can stay
           transparent — paint on the shell itself travels with the drag. -->
      <view :class="ui.itemContent({ class: props.ui?.itemContent })">
        <slot name="item" :item="it" :index="index" />
      </view>
    </SortableItem>
  </SortableRoot>
</template>
