<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogCloseProps extends PrimitiveProps {}
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

useForwardExpose()
const rootContext = injectDialogRootContext()

const attrs = useAttrs()
const a11y = useA11y(() => ({
  role: 'button',
  label: (attrs['accessibility-label'] as string) || 'Close',
}))

// While the group is animating in/out, swallow close taps so a half-open
// dialog isn't asked to close mid-enter. Matches lynx-ui's `DialogButton`.
const busy = computed(() => resolveBusyState(rootContext.groupState.value))

function onTap() {
  if (busy.value) return
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
