<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface PopoverRootProps {
  /**
   * The open state of the popover when it is initially rendered.
   * Use when you do not need to control its open state.
   */
  defaultOpen?: boolean
  /** The controlled open state of the popover. Can be bound with `v-model`. */
  open?: boolean
  /**
   * The modality of the popover. When `true` the content registers as a modal
   * overlay (scroll-lock / hide-others would apply on the DOM). On Lynx those
   * are no-ops, but the flag still selects `PopoverContentModal` vs
   * `PopoverContentNonModal`.
   *
   * @defaultValue false
   */
  modal?: boolean
}

export type PopoverRootEmits = {
  /** Event handler called when the open state of the popover changes. */
  'update:open': [value: boolean]
}

export interface PopoverRootContext {
  open: Ref<boolean>
  modal: Ref<boolean>
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
}

export const [injectPopoverRootContext, providePopoverRootContext]
  = createContext<PopoverRootContext>('PopoverRoot')
</script>

<script setup lang="ts">
import { toRefs } from 'vue'
import { useStandardVModelOf } from '@/shared/composables'

const props = withDefaults(defineProps<PopoverRootProps>(), {
  defaultOpen: false,
  open: undefined,
  modal: false,
})

const emit = defineEmits<PopoverRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
    /** Close the popover */
    close: () => void
  }) => any
}>()

const { modal } = toRefs(props)

const open = useStandardVModelOf<boolean>(props, 'open', emit)

providePopoverRootContext({
  open,
  modal,
  onOpenChange: (value) => {
    open.value = value
  },
  onOpenToggle: () => {
    open.value = !open.value
  },
})
</script>

<template>
  <slot
    :open="open"
    :close="() => (open = false)"
  />
</template>
