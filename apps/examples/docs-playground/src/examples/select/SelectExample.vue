<script setup lang="ts">
import { ref } from 'vue'
import { VySelect } from '@vyui/kit'

const value = ref<string>()
const items = ['Vue', 'React', 'Svelte']
</script>

<template>
  <VySelect
    v-model="value"
    :items="items"
    placeholder="Choose a framework"
    class="w-full"
  />
</template>
