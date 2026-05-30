<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from '..'

const props = defineProps<{
  value?: number | null
  max?: number
}>()
</script>

<template>
  <ProgressRoot :model-value="props.value" :max="props.max">
    <ProgressIndicator />
  </ProgressRoot>
</template>
