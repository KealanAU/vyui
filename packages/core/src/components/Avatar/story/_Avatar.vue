<script setup lang="ts">
import {
  AvatarFallback,
  AvatarImage,
  AvatarRoot,
} from '..'

defineProps<{
  src?: string
  fallback?: string
  delayMs?: number
}>()
</script>

<template>
  <AvatarRoot data-testid="root">
    <AvatarImage
      :src="src"
      data-testid="image"
    />
    <AvatarFallback
      :delay-ms="delayMs"
      data-testid="fallback"
    >
      <text>{{ fallback }}</text>
    </AvatarFallback>
  </AvatarRoot>
</template>
