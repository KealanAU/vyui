<script setup lang="ts">
import { ref } from 'vue'
import { VyToggle } from '@vyui/kit'

const pinned = ref(true)
</script>

<template>
  <VyToggle v-model="pinned" color="warning" variant="soft" size="lg">
    Pinned
  </VyToggle>
</template>
