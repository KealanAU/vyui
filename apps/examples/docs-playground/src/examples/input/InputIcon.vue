<script setup lang="ts">
import { ref } from 'vue'
import { VyInput } from '@vyui/kit'

const query = ref('')
</script>

<template>
  <VyInput
    v-model="query"
    icon="i-lucide-search"
    placeholder="Search projects"
    class="w-[280px]"
  />
</template>
