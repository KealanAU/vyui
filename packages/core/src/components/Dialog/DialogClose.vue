<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogCloseProps extends PrimitiveProps {}

export type DialogCloseEmits = {
  /** Fired when the control is tapped and the tap wasn't swallowed as busy —
   *  before the dialog closes. Backs `AlertDialogAction`. */
  click: []
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y } from '@/shared/composables'
import { injectDialogRootContext } from './DialogRoot.vue'
import { resolveBusyState } from '@/components/Presence'

const props = withDefaults(defineProps<DialogCloseProps>(), {
  as: 'view',
})

const emit = defineEmits<DialogCloseEmits>()

useForwardExpose()
const rootContext = injectDialogRootContext()

const attrs = useAttrs()
// No fallback label: the control announces its own child text. Icon-only
// closers (kit's Modal) pass `accessibility-label` themselves.
const a11y = useA11y(() => ({
  role: 'button',
  label: attrs['accessibility-label'] as string | undefined,
}))

// While the group is animating in/out, swallow close taps so a half-open
// dialog isn't asked to close mid-enter. Matches lynx-ui's `DialogButton`.
const busy = computed(() => resolveBusyState(rootContext.groupState.value))

function onTap() {
  if (busy.value) return
  emit('click')
  rootContext.onOpenChange(false)
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    v-bind="a11y"
    :data-busy="busy ? '' : undefined"
    @tap="onTap"
  >
    <slot />
  </Primitive>
</template>
