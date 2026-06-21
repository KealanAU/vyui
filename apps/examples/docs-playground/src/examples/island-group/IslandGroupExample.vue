<script setup lang="ts">
import { ref } from 'vue'
import { VyIsland, VyIslandButton, VyIslandGroup } from '@vyui/kit'

const section = ref<string | number | null>('inbox')
</script>

<template>
  <VyIslandGroup position="bottom">
    <VyIsland v-model:value="section" layer="inline" size="lg">
      <VyIslandButton value="inbox" icon="i-lucide-inbox" />
      <VyIslandButton value="activity" icon="i-lucide-bell" />
      <VyIslandButton value="profile" icon="i-lucide-user" />
    </VyIsland>

    <VyIsland layer="inline" size="lg">
      <VyIslandButton icon="i-lucide-plus" accessibility-label="Compose" />
    </VyIsland>
  </VyIslandGroup>
</template>
