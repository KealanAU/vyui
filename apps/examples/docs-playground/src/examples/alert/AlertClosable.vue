<script setup lang="ts">
import { ref } from 'vue'
import { VyAlert } from '@vyui/kit'

const open = ref(true)
</script>

<template>
  <VyAlert
    v-if="open"
    title="Unsaved changes"
    description="Your edits will be lost if you leave."
    icon="i-lucide-triangle-alert"
    color="warning"
    variant="subtle"
    close
    class="w-[320px]"
    @update:open="open = $event"
  />
</template>
