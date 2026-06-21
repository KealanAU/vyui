<script setup lang="ts">
// The @vyui/core primitives that VyAccordion is built on. Use these directly
// when you need full control over markup and styling.
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
} from '@vyui/core'

const items = [
  { value: 'icons', label: 'Icons', content: 'You have nothing to do, the icon set handles it automatically.' },
  { value: 'colors', label: 'Colors', content: 'Choose a primary and a neutral color from your theme.' },
]
</script>

<template>
  <AccordionRoot
    type="single"
    :collapsible="true"
    default-value="icons"
    class="w-[320px] rounded-lg border border-neutral-200 bg-white overflow-hidden"
  >
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      class="border-b border-neutral-200"
    >
      <AccordionHeader>
        <AccordionTrigger class="flex flex-row items-center justify-between w-full px-4 py-3">
          <text class="text-sm font-medium text-neutral-900">{{ item.label }}</text>
          <text class="text-neutral-400">+</text>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent class="px-4 pb-3">
        <text class="text-sm text-neutral-500">{{ item.content }}</text>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
