<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { VyInput } from '@vyui/kit'

const maxLength = 15
const value = ref('')

const count = computed(() => `${value.value.length}/${maxLength}`)

watch(value, (next) => {
  if (next.length > maxLength) {
    value.value = next.slice(0, maxLength)
  }
})
</script>

<template>
  <VyInput
    v-model="value"
    placeholder="Short label"
    class="w-[280px]"
  >
    <template #trailing>
      <text class="text-xs text-neutral-400">{{ count }}</text>
    </template>
  </VyInput>
</template>
