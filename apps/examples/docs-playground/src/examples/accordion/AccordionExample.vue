<script setup lang="ts">
import { VyAccordion } from '@vyui/kit'

const items = [
  { label: 'Is it accessible?', icon: 'i-lucide-accessibility', content: 'Keyboard and screen reader behavior are built in on every platform.' },
  { label: 'Does it run on Lynx?', icon: 'i-lucide-smartphone', content: 'Yes — the same component renders on iOS, Android, and web.' },
  { label: 'Can I theme it?', icon: 'i-lucide-palette', content: 'Every visual slot is customizable through the kit theme or the ui prop.' },
]
</script>

<template>
  <VyAccordion :items="items" default-value="0" class="w-[320px]" />
</template>
