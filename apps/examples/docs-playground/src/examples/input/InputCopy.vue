<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyInput } from '@vyui/kit'

const value = ref('hello@vyui.dev')
const copied = ref(false)

async function copyValue() {
  const writeText = (globalThis as any).navigator?.clipboard?.writeText
  if (!writeText) return

  await writeText(value.value)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 1200)
}
</script>

<template>
  <VyInput
    v-model="value"
    class="w-[280px]"
  >
    <template #trailing>
      <VyButton
        size="xs"
        variant="ghost"
        color="neutral"
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="copied ? 'Copied' : 'Copy'"
        @tap="copyValue"
      />
    </template>
  </VyInput>
</template>
