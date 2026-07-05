<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyInput } from '@vyui/kit'

const password = ref('')
const show = ref(false)
</script>

<template>
  <VyInput
    v-model="password"
    :type="show ? 'text' : 'password'"
    placeholder="Password"
    class="w-[280px]"
  >
    <template #trailing>
      <VyButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :label="show ? 'Hide' : 'Show'"
        @tap="show = !show"
      />
    </template>
  </VyInput>
</template>
