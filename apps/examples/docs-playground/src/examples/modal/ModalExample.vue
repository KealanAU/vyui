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
    <VyButton color="error" variant="soft">Discard draft</VyButton>

    <template #footer="{ close }">
      <VyButton color="neutral" variant="ghost" @tap="close">
        Keep editing
      </VyButton>
      <VyButton color="error" @tap="close">
        Discard
      </VyButton>
    </template>
  </VyModal>
</template>
