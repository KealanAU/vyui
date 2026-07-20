<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/KeyboardAwareTrigger.tsx.

  Wraps content that should pull the surrounding `KeyboardAwareResponder` up
  when its child input gains focus. Reads the root context, publishes a
  trigger context for the input descendants, and reports `layoutchange`
  events so the root can re-measure when the trigger resizes (e.g. an input
  growing as the user types).
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface KeyboardAwareTriggerProps extends PrimitiveProps {
  /**
   * Extra pixels to leave between the bottom of the trigger and the top of
   * the keyboard once it has been pulled into view. When omitted, the
   * surrounding `KeyboardAwareRoot`'s `offset` applies.
   */
  offset?: number
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import { Primitive, usePrimitiveElement } from '@/components/Primitive'
import type { KeyboardAwareKeyboardInfo } from './keyboardAwareContext'
import {
  injectKeyboardAwareRootContext,
  injectKeyboardAwareTriggerContext,
  provideKeyboardAwareTriggerContext,
} from './keyboardAwareContext'

// `offset` deliberately has NO default: an explicit 0 would override the
// root's `offset` (the root only falls back to its own when the trigger
// reports `undefined`).
const props = withDefaults(defineProps<KeyboardAwareTriggerProps>(), {
  as: 'view',
})

const { primitiveElement, currentElement } = usePrimitiveElement()

// The root may be absent — render plainly when so. Triggers should still be
// usable as a normal wrapper element in that case.
const rootContext = injectKeyboardAwareRootContext(null)

/** Wrapper ref shared with the root via the trigger context. */
const triggerRef = ref<{ current: unknown }>({ current: null })

/** Height cache — only re-measure if the layout actually changed. */
const lastHeight = ref<number>(0)

function syncTriggerRef() {
  triggerRef.value.current = currentElement.value
}

function onLayoutChange(event: any) {
  const h: number = event?.detail?.height ?? event?.target?.offsetHeight ?? 0
  if (h !== lastHeight.value) {
    lastHeight.value = h
    syncTriggerRef()
    rootContext?.onAwareTriggerLayoutChanged?.(triggerRef.value)
  }
}

function onInputFocused() {
  syncTriggerRef()
  rootContext?.onAwareTriggerFocused?.(triggerRef.value, props.offset)
}

function onInputBlurred() {
  rootContext?.onAwareTriggerBlurred?.(triggerRef.value)
}

function onInputKeyboard(info: KeyboardAwareKeyboardInfo) {
  syncTriggerRef()
  rootContext?.onAwareTriggerKeyboardChanged?.(triggerRef.value, info)
}

// Nested triggers: kit inputs render an internal field-level trigger, so a
// consumer wrapping `VyInput` in their own trigger produces two. The OUTER
// one carries the consumer's intent (their wrapper element + offset) — when
// one exists, re-provide it untouched so this inner trigger is a pass-through.
const outerTrigger = injectKeyboardAwareTriggerContext(null)

provideKeyboardAwareTriggerContext(outerTrigger ?? {
  onInputFocused,
  onInputBlurred,
  onInputKeyboard,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    ignore-focus
    flatten="false"
    @layoutchange="onLayoutChange"
  >
    <slot />
  </Primitive>
</template>
