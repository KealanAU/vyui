<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface AlertDialogRootProps {
  /** The open state of the alert dialog when it is initially rendered. Use when you do not need to control its open state. */
  defaultOpen?: boolean
  /** The controlled open state of the alert dialog. Can be bound with `v-model`. */
  open?: boolean
}

export type AlertDialogRootEmits = {
  /** Event handler called when the open state of the alert dialog changes. */
  'update:open': [value: boolean]
}

interface AlertDialogRootContext {
  open: Ref<boolean>
  onOpenChange: (value: boolean) => void
  /** Set by `AlertDialogContentImpl`; consumed for accessibility labelling. */
  titleId?: string
  /** Set by `AlertDialogContentImpl`; consumed for accessibility labelling. */
  descriptionId?: string
}

export const [injectAlertDialogRootContext, provideAlertDialogRootContext]
  = createContext<AlertDialogRootContext>('AlertDialogRoot')
</script>

<script setup lang="ts">
import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<AlertDialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
})

const emit = defineEmits<AlertDialogRootEmits>()

defineSlots<{
  default?: (props: { open: boolean }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emit)

provideAlertDialogRootContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
})

defineExpose({ open })
</script>

<template>
  <slot :open="open" />
</template>
