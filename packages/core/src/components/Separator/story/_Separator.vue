<script setup lang="ts">
import type { SeparatorProps } from '..'
import { Separator } from '..'

const props = defineProps<SeparatorProps>()
</script>

<template>
  <Separator v-bind="props" />
</template>
