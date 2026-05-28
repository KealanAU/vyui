<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface DropdownMenuSubProps {
  /** The open state of the sub-menu when it is initially rendered. */
  defaultOpen?: boolean
  /** The controlled open state of the sub-menu. */
  open?: boolean
}

export type DropdownMenuSubEmits = {
  'update:open': [value: boolean]
}

export interface DropdownMenuSubContext {
  open: Readonly<Ref<boolean>>
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
}

export const [injectDropdownMenuSubContext, provideDropdownMenuSubContext]
  = createContext<DropdownMenuSubContext>('DropdownMenuSub')
</script>

<script setup lang="ts">
import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<DropdownMenuSubProps>(), {
  open: undefined,
  defaultOpen: false,
})

const emit = defineEmits<DropdownMenuSubEmits>()

defineSlots<{
  default?: (props: { open: boolean }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emit)

provideDropdownMenuSubContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
})

defineExpose({ open })
</script>

<template>
  <slot :open="open" />
</template>
