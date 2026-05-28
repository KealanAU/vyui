<script lang="ts">
import type { Ref } from 'vue'
import type { Direction } from '@/shared/types'
import { createContext } from '@/shared'

export interface DropdownMenuRootProps {
  /** The open state of the dropdown menu when it is initially rendered. */
  defaultOpen?: boolean
  /** The controlled open state of the dropdown menu. Can be binded with `v-model:open`. */
  open?: boolean
  /** When `true`, interaction with outside elements will be disabled and only menu content will be visible to screen readers. */
  modal?: boolean
  /** The reading direction of the combobox when applicable. */
  dir?: Direction
}

export type DropdownMenuRootEmits = {
  'update:open': [value: boolean]
}

export interface DropdownMenuRootContext {
  open: Readonly<Ref<boolean>>
  onOpenChange: (open: boolean) => void
  onOpenToggle: () => void
  modal: Ref<boolean>
  dir: Ref<Direction>
}

export const [injectDropdownMenuRootContext, provideDropdownMenuRootContext]
  = createContext<DropdownMenuRootContext>('DropdownMenuRoot')
</script>

<script setup lang="ts">
import { ref, toRefs } from 'vue'
import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<DropdownMenuRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
  dir: 'ltr',
})

const emit = defineEmits<DropdownMenuRootEmits>()

defineSlots<{
  default?: (props: { open: boolean }) => any
}>()

const open = useStandardVModelOf<boolean>(props, 'open', emit)

const { modal } = toRefs(props)
const dir = ref(props.dir) as Ref<Direction>

provideDropdownMenuRootContext({
  open,
  onOpenChange: (value: boolean) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
  modal,
  dir,
})

defineExpose({ open })
</script>

<template>
  <slot :open="open" />
</template>
