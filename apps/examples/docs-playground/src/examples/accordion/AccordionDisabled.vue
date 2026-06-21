<script setup lang="ts">
import { VyAccordion } from '@vyui/kit'

const items = [
  { value: 'icons', label: 'Icons', content: 'The icon set is resolved automatically.' },
  { value: 'colors', label: 'Colors', content: 'This item is disabled and cannot be opened.', disabled: true },
  { value: 'components', label: 'Components', content: 'Customize components with the class / ui props.' },
]
</script>

<template>
  <VyAccordion :items="items" class="w-[320px]" />
</template>
