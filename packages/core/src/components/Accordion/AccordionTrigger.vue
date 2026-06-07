<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface AccordionTriggerProps extends PrimitiveProps {}
</script>

<script setup lang="ts">
import { CollapsibleTrigger } from '@/components/Collapsible'
import { useId } from '@/shared'
import { injectAccordionItemContext } from './AccordionItem.vue'

import { injectAccordionRootContext } from './AccordionRoot.vue'

const props = defineProps<AccordionTriggerProps>()

const rootContext = injectAccordionRootContext()
const itemContext = injectAccordionItemContext()

itemContext.triggerId ||= useId(undefined, 'vy-accordion-trigger')
</script>

<template>
  <CollapsibleTrigger
    :id="itemContext.triggerId"
    :ref="itemContext.currentRef"
    data-vyui-collection-item
    :as="props.as"
    :as-child="props.asChild"
    :class="{
      'ui-open': itemContext.dataState.value === 'open',
      'ui-closed': itemContext.dataState.value === 'closed',
      'ui-disabled': itemContext.disabled.value,
    }"
    :data-disabled="itemContext.dataDisabled.value"
    :data-orientation="rootContext.orientation"
    :data-state="itemContext.dataState.value"
    :disabled="itemContext.disabled.value"
  >
    <slot />
  </CollapsibleTrigger>
</template>
