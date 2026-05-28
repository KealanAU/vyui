<script setup lang="ts">
import type { AccordionRootEmits, AccordionRootProps } from '..'
import { useEmitAsProps } from '@/shared'
import { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger } from '..'

withDefaults(defineProps<{ type?: AccordionRootProps['type'] }>(), { type: 'single' })
const emits = defineEmits<AccordionRootEmits>()
const values = ['One', 'Two', 'Three', 'Four']
</script>

<template>
  <AccordionRoot v-bind="useEmitAsProps(emits)" :type="type">
    <AccordionItem v-for="value in values" :key="value" :value="value">
      <AccordionHeader>
        <AccordionTrigger>{{ value }}</AccordionTrigger>
      </AccordionHeader>
      <AccordionContent>
        <text>Content {{ value }}</text>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
