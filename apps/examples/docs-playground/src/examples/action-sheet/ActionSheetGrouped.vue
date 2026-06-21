<script setup lang="ts">
import { ref } from 'vue'
import { VyActionSheet, VyButton } from '@vyui/kit'

const open = ref(false)
const groups = [
  [
    { label: 'Share', icon: 'i-lucide-share-2' },
    { label: 'Copy link', icon: 'i-lucide-link' },
  ],
  [
    { label: 'Remove', icon: 'i-lucide-trash-2', color: 'error' as const },
  ],
]
</script>

<template>
  <VyActionSheet v-model="open" :items="groups" cancel="Not now">
    <VyButton>More</VyButton>
  </VyActionSheet>
</template>
