<script lang="ts">
import type { ComputedRef, VNodeRef } from 'vue'
import type { CollapsibleRootProps } from '../Collapsible'
import { createContext, useForwardExpose } from '@/shared'
import { injectAccordionRootContext } from './AccordionRoot.vue'

enum AccordionItemState {
  Open = 'open',
  Closed = 'closed',
}

export interface AccordionItemProps
  extends Omit<CollapsibleRootProps, 'open' | 'defaultOpen' | 'onOpenChange'> {
  /**
   * Whether or not an accordion item is disabled from user interaction.
   * When `true`, prevents the user from interacting with the item.
   *
   * @defaultValue false
   */
  disabled?: boolean
  /**
   * A string value for the accordion item. All items within an accordion should use a unique value.
   */
  value: string
}

interface AccordionItemContext {
  open: ComputedRef<boolean>
  dataState: ComputedRef<AccordionItemState>
  disabled: ComputedRef<boolean>
  dataDisabled: ComputedRef<'' | undefined>
  triggerId: string
  currentRef: VNodeRef
  currentElement: ComputedRef<HTMLElement | undefined>
  value: ComputedRef<string>
}

export const [injectAccordionItemContext, provideAccordionItemContext]
  = createContext<AccordionItemContext>('AccordionItem')
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { CollapsibleRoot } from '@/components/Collapsible'

const props = withDefaults(
  defineProps<AccordionItemProps>(),
  {
    unmountOnHide: undefined,
  },
)

defineSlots<{
  default?: (props: {
    /** Current open state */
    open: typeof open.value
  }) => any
}>()

const rootContext = injectAccordionRootContext()

const open = computed(() =>
  rootContext.isSingle.value
    ? props.value === rootContext.modelValue.value
    : Array.isArray(rootContext.modelValue.value)
      && rootContext.modelValue.value.includes(props.value),
)

const disabled = computed(() => {
  return (rootContext.disabled.value || props.disabled)
})

const dataDisabled = computed(() => (disabled.value ? '' : undefined))

const dataState = computed(() =>
  open.value ? AccordionItemState.Open : AccordionItemState.Closed,
)

defineExpose({ open, dataDisabled })
const { currentRef, currentElement } = useForwardExpose()

provideAccordionItemContext({
  open,
  dataState,
  disabled,
  dataDisabled,
  triggerId: '',
  currentRef,
  currentElement,
  value: computed(() => props.value),
})

function handleOpenUpdate() {
  // Single non-collapsible: prevent closing the open item
  const triggerDisabled = rootContext.isSingle.value && open.value && !rootContext.collapsible
  if (triggerDisabled)
    return
  rootContext.changeModelValue(props.value)
}
</script>

<template>
  <CollapsibleRoot
    :data-orientation="rootContext.orientation"
    :data-disabled="dataDisabled"
    :data-state="dataState"
    :disabled="disabled"
    :open="open"
    :as="props.as"
    :as-child="props.asChild"
    :unmount-on-hide="props.unmountOnHide ?? rootContext.unmountOnHide.value"
    @update:open="handleOpenUpdate"
  >
    <slot :open="open" />
  </CollapsibleRoot>
</template>
