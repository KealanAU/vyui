<script lang="ts">
import type {
  PopoverContentImplEmits,
  PopoverContentImplProps,
} from './PopoverContentImpl.vue'

export type PopoverContentEmits = PopoverContentImplEmits

export interface PopoverContentProps extends PopoverContentImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with Vue animation libraries.
   */
  forceMount?: boolean
}
</script>

<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { Presence } from '@/components/Presence'
import { useEmitAsProps, useForwardExpose } from '@/shared'
import PopoverContentModal from './PopoverContentModal.vue'
import { injectPopoverRootContext } from './PopoverRoot.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<PopoverContentProps>()
const emits = defineEmits<PopoverContentEmits>()

const rootContext = injectPopoverRootContext()

// reka-ui forwards props + emits with `useForwardPropsEmits`; here we forward
// the `PopoverContentImpl` props (sans the wrapper-only `forceMount`) with
// `v-bind` and re-expose emits as props.
const forwarded = reactiveOmit(props, 'forceMount')
const emitsAsProps = useEmitAsProps(emits)
const { forwardRef } = useForwardExpose()
</script>

<template>
  <Presence :present="forceMount || rootContext.open.value">
    <PopoverContentModal
      :ref="forwardRef"
      v-bind="{ ...forwarded, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </PopoverContentModal>
  </Presence>
</template>
