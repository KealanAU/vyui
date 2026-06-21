<script setup lang="ts">
import { ref } from 'vue'
import { VyActionSheet, VyButton } from '@vyui/kit'

const open = ref(false)
const items = [
  { label: 'Edit', icon: 'i-lucide-pencil', value: 'edit' },
  { label: 'Duplicate', icon: 'i-lucide-copy', value: 'duplicate' },
  { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' as const, value: 'delete' },
]
</script>

<template>
  <VyActionSheet v-model:open="open" title="Actions" :items="items" cancel>
    <VyButton>Open actions</VyButton>
  </VyActionSheet>
</template>
