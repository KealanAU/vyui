<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyInput } from '@vyui/kit'

const value = ref('Click to clear')
</script>

<template>
  <VyInput
    v-model="value"
    placeholder="Type something..."
    class="w-[280px]"
  >
    <template v-if="value.length" #trailing>
      <VyButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-circle-x"
        label="Clear"
        @tap="value = ''"
      />
    </template>
  </VyInput>
</template>
