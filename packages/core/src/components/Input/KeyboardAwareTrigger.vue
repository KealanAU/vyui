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
   * the keyboard once it has been pulled into view.
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
  provideKeyboardAwareTriggerContext,
} from './keyboardAwareContext'

const props = withDefaults(defineProps<KeyboardAwareTriggerProps>(), {
  as: 'view',
  offset: 0,
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

provideKeyboardAwareTriggerContext({
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
