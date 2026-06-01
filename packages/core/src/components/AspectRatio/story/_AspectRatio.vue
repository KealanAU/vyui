<script setup lang="ts">
import type { AspectRatioRootProps } from '..'
import { AspectRatio } from '..'

const props = defineProps<AspectRatioRootProps>()
</script>

<template>
  <AspectRatio v-bind="props">
    <text>slot-content</text>
  </AspectRatio>
</template>
