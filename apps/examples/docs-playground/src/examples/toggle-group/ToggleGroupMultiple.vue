<script setup lang="ts">
import { ref } from 'vue'
import { VyToggleGroup } from '@vyui/kit'

const formatting = ref<string[]>(['bold'])
const items = [
  { label: 'Bold', value: 'bold', icon: 'i-lucide-bold' },
  { label: 'Italic', value: 'italic', icon: 'i-lucide-italic' },
  { label: 'Underline', value: 'underline', icon: 'i-lucide-underline' },
]
</script>

<template>
  <VyToggleGroup v-model="formatting" type="multiple" :items="items" />
</template>
