<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface DialogTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'
import { resolveBusyState } from '@/components/Presence'

const props = withDefaults(defineProps<DialogTriggerProps>(), {
  as: 'view',
})

useForwardExpose()
const rootContext = injectDialogRootContext()

// `busy` mirrors lynx-ui's `DialogButton`: while the group is animating in or
// out, swallow taps so a spam-tapping user can't double-fire the open
// transition. Once the group settles in Entered / Left, taps work again.
const busy = computed(() => resolveBusyState(rootContext.groupState.value))

function onTap() {
  if (busy.value) return
  rootContext.onOpenToggle()
}
</script>

<template>
  <Primitive
    :as="props.as"
    :as-child="props.asChild"
    accessibility-traits="button"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    :data-busy="busy ? '' : undefined"
    @tap="onTap"
  >
    <slot />
  </Primitive>
</template>
