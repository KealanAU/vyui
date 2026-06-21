<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyModal } from '@vyui/kit'

const open = ref(false)
</script>

<template>
  <VyModal
    v-model:open="open"
    title="Discard changes?"
    description="Your unsaved changes will be lost."
  >
    <VyButton color="neutral" variant="soft" label="Open dialog" />

    <template #footer="{ close }">
      <VyButton color="neutral" variant="ghost" label="Keep editing" @tap="close" />
      <VyButton color="error" label="Discard" @tap="close" />
    </template>
  </VyModal>
</template>
