<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland, VyIslandButton } from '@vyui/kit'

const section = ref<string | number | null>('inbox')
</script>

<template>
  <VyIsland v-model:value="section" layer="inline">
    <VyIslandButton value="inbox" icon="i-lucide-inbox" />
    <VyIslandButton value="activity" icon="i-lucide-bell" />
    <VyIslandButton value="profile" icon="i-lucide-user" />
  </VyIsland>
</template>
