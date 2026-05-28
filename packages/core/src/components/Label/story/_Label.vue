<script setup lang="ts">
import { Label } from '..'

const props = defineProps<{ for?: string; text?: string }>()
</script>

<template>
  <Label :for="props.for">{{ props.text }}</Label>
</template>
