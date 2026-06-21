<script setup lang="ts">
import { VyIsland, VyIslandButton } from '@vyui/kit'
</script>

<template>
  <VyIsland layer="inline" size="lg">
    <VyIslandButton icon="i-lucide-plus" label="New issue" />
    <VyIslandButton icon="i-lucide-settings" accessibility-label="Settings" />
  </VyIsland>
</template>
