<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Ported from `lynx-family/lynx-ui` `packages/lynx-ui-button/src/Button.tsx`
     (Apache 2.0). React render-prop maps to a Vue scoped default slot. -->
<script lang="ts">
import type { TouchEvent } from '@lynx-js/types'
import type { AsTag } from '@/components/Primitive'

export interface ButtonProps {
  /** Disables tap + active feedback. */
  disabled?: boolean
  /** Underlying element. Defaults to `view`. @defaultValue `'view'` */
  as?: AsTag
  /** Merge props onto the slot child instead of wrapping. */
  asChild?: boolean
}

export type ButtonEmits = {
  /** Fires on tap when not disabled, forwarding the Lynx tap event. */
  tap: [event: TouchEvent]
}
</script>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue'

import { Primitive } from '@/components/Primitive'
import { useA11y } from '@/shared/composables'
import { useTouchEmulation } from '@/shared/composables/useTouchEmulation'

import { provideButtonContext } from './buttonContext'

const props = withDefaults(defineProps<ButtonProps>(), {
  disabled: false,
  as: 'view',
})

const emits = defineEmits<ButtonEmits>()

defineSlots<{
  default?: (props: { active: boolean, disabled: boolean }) => any
}>()

const pressed = ref(false)

const active = computed(() => pressed.value && !props.disabled)

const touchHandlers = useTouchEmulation({
  onTouchStart: () => {
    if (props.disabled) return
    pressed.value = true
  },
  onTouchEnd: () => {
    pressed.value = false
  },
  onTouchCancel: () => {
    pressed.value = false
  },
})

// Forward the event: listeners merged in via `asChild` (e.g. ToastClose's
// `@tap.stop`) may be modifier-wrapped and dereference it — emitting bare
// crashes them with `undefined.stopPropagation`.
function onTap(event: TouchEvent) {
  if (props.disabled) return
  emits('tap', event)
}

provideButtonContext({
  active,
  disabled: toRef(props, 'disabled'),
})

const a11y = useA11y(() => ({
  role: 'button',
  disabled: props.disabled,
}))
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :data-state="active ? 'active' : 'inactive'"
    :data-disabled="disabled ? '' : undefined"
    :event-through="false"
    v-bind="{ ...touchHandlers, ...a11y }"
    @tap="onTap"
  >
    <slot :active="active" :disabled="disabled" />
  </Primitive>
</template>
