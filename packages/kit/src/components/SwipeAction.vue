<script lang="ts">
import theme from '../theme/swipeAction'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type SwipeActionTV = ThemeTV<typeof theme>
type SwipeActionVariants = VariantProps<SwipeActionTV>

export interface SwipeActionProps {
  /** Width of the revealed action panel in px. Forwarded to the core primitive
   *  — required for the threshold math. */
  actionWidth: number
  /** Width of the row in px. Forwarded to the core primitive — required to
   *  compute the commit threshold. */
  rowWidth: number
  /** Controlled open state. Bind with `v-model:open`. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Disable interaction. */
  disabled?: boolean
  /** Fraction of `actionWidth` the user must drag past to snap open. 0–1. Maps
   *  to the core `snapThreshold` prop. */
  threshold?: number
  /** Which side reveals the actions. Styling only — the core primitive always
   *  reveals from the trailing (right) edge. */
  side?: SwipeActionVariants['side']
  class?: ClassValue
  ui?: Partial<Record<keyof SwipeActionTV['slots'], ClassValue>>
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
import { SwipeAction as CoreSwipeAction } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SwipeActionProps>(), {
  defaultOpen: false,
  disabled: false,
  side: 'right',
})

const emit = defineEmits<SwipeActionEmits>()
defineSlots<SwipeActionSlots>()

const { ui } = useStyledComponent('swipeAction', theme, () => ({
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
