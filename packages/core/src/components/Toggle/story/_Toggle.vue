<script setup lang="ts">
import type { ToggleProps } from '..'
import { Toggle } from '..'

const props = defineProps<ToggleProps>()
</script>

<template>
  <Toggle v-bind="props">Label</Toggle>
</template>
