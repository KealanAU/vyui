<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/swipeAction'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.swipeAction`.
 */
export const buildSwipeAction = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).swipeAction as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
})

type SwipeActionVariants = VariantProps<ReturnType<typeof buildSwipeAction>>

export interface SwipeActionProps {
  /**
   * Width of the revealed action panel in px. Forwarded to the core
   * `SwipeAction` primitive — required for the threshold math.
   */
  actionWidth: number
  /**
   * Width of the row in px. Forwarded to the core primitive — required to
   * compute the commit threshold.
   */
  rowWidth: number
  /** Controlled open state. Bind with `v-model:open`. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Disable interaction. */
  disabled?: boolean
  /**
   * Fraction of `actionWidth` the user must drag past to snap open. 0–1.
   * Maps to the core `snapThreshold` prop.
   */
  threshold?: number
  /**
   * Which side reveals the actions. Drives styling only — the core
   * primitive currently always reveals from the trailing (right) edge.
   */
  side?: SwipeActionVariants['side']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildSwipeAction>['slots'], any>>
}

export interface SwipeActionEmits {
  (e: 'update:open', value: boolean): void
  (e: 'commit'): void
}

export interface SwipeActionSlots {
  /** Main row content. Scoped with `{ open, close }` from the core primitive. */
  default(props: { open: boolean, close: () => void }): any
  /** Action panel revealed on swipe. Scoped with `{ open, close }`. */
  actions(props: { open: boolean, close: () => void }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { SwipeAction as CoreSwipeAction } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<SwipeActionProps>(), {
  defaultOpen: false,
  disabled: false,
  side: 'right',
})

const emit = defineEmits<SwipeActionEmits>()
defineSlots<SwipeActionSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildSwipeAction(appConfig)({
  side: props.side,
}))

function onUpdateOpen(value: boolean) {
  emit('update:open', value)
}

function onCommit() {
  emit('commit')
}
</script>

<template>
  <CoreSwipeAction
    :action-width="actionWidth"
    :row-width="rowWidth"
    :open="open"
    :default-open="defaultOpen"
    :disabled="disabled"
    :snap-threshold="threshold"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:open="onUpdateOpen"
    @commit="onCommit"
  >
    <template #default="scope">
      <view :class="ui.content({ class: props.ui?.content })">
        <slot v-bind="scope" />
      </view>
    </template>
    <template #action="scope">
      <view :class="ui.actions({ class: props.ui?.actions })">
        <slot name="actions" v-bind="scope" />
      </view>
    </template>
  </CoreSwipeAction>
</template>
