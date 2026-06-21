<script setup lang="ts">
import { ref } from 'vue'
import { VyToggleGroup } from '@vyui/kit'

const alignment = ref('center')
const items = [
  { label: 'Left', value: 'left', icon: 'i-lucide-align-left' },
  { label: 'Center', value: 'center', icon: 'i-lucide-align-center' },
  { label: 'Right', value: 'right', icon: 'i-lucide-align-right' },
]
</script>

<template>
  <VyToggleGroup v-model="alignment" :items="items" />
</template>
