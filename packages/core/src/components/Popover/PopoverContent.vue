<script lang="ts">
import type {
  PopoverContentImplEmits,
  PopoverContentImplProps,
} from './PopoverContentImpl.vue'

export type PopoverContentEmits = PopoverContentImplEmits

export interface PopoverContentProps extends PopoverContentImplProps {}
</script>

<script setup lang="ts">
import { Presence } from '@/components/Presence'
import { useEmitAsProps, useForwardExpose } from '@/shared'
import PopoverContentModal from './PopoverContentModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()

// reka-ui forwards props + emits with `useForwardPropsEmits`; here we `v-bind`
// the props and re-expose emits as props.
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef } = useForwardExpose()
</script>

<template>
  <Presence :show="rootContext.open.value">
    <PopoverContentModal
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </PopoverContentModal>
  </Presence>
</template>
