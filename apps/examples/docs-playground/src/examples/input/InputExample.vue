<script setup lang="ts">
import { ref } from 'vue'
import { VyInput } from '@vyui/kit'

const email = ref('')
</script>

<template>
  <VyInput
    v-model="email"
    type="email"
    placeholder="you@example.com"
    class="w-[280px]"
  />
</template>
