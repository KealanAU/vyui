<script setup lang="ts">
import { ref } from 'vue'
import { ProgressIndicator, ProgressRoot } from '..'

const interactive = ref(0)
setTimeout(() => {
  interactive.value = (interactive.value + 50) % 100
}, 200)
</script>

<template>
  <ProgressRoot v-model="interactive">
    <ProgressIndicator />
  </ProgressRoot>
</template>
