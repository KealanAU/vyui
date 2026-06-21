<script setup lang="ts">
import { VySkeleton } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-row gap-3 w-full">
    <VySkeleton class="size-12 rounded-full" />

    <view class="flex-1 flex flex-col gap-2">
      <VySkeleton class="h-4 w-2/3" />
      <VySkeleton class="h-3 w-full" />
      <VySkeleton class="h-3 w-4/5" />
    </view>
  </view>
</template>
