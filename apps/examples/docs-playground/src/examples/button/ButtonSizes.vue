<script setup lang="ts">
import { VyButton } from '@vyui/kit'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton
      v-for="size in sizes"
      :key="size"
      :size="size"
      :label="`Size ${size.toUpperCase()}`"
    />
  </view>
</template>
