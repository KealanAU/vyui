<script lang="ts">
import type { DialogRootEmits, DialogRootProps } from '@/components/Dialog'

/** `DialogRoot` with `role="alertdialog"` preset — modal by default and never
 *  dismissed by an outside tap. */
export interface AlertDialogRootProps extends Omit<DialogRootProps, 'role'> {}

export type AlertDialogRootEmits = DialogRootEmits
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { DialogRoot } from '@/components/Dialog'

// `undefined` defaults, not Vue's Boolean-prop `false` normalization: an unset
// `open` must stay undefined so it can be filtered out below.
const props = withDefaults(defineProps<AlertDialogRootProps>(), {
  open: undefined,
  defaultOpen: undefined,
  modal: undefined,
})
const emit = defineEmits<AlertDialogRootEmits>()

// Forward only what the caller actually set. `useStandardVModelOf` reads
// vnode-prop PRESENCE to pick controlled vs uncontrolled, so spreading the
// whole props object would put `open: undefined` on DialogRoot's vnode and pin
// it to controlled — an uncontrolled AlertDialog would never open.
const forwarded = computed(() =>
  Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)),
)
</script>

<template>
  <DialogRoot
    v-bind="forwarded"
    role="alertdialog"
    @update:open="emit('update:open', $event)"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </DialogRoot>
</template>
