<script setup lang="ts">
import { VyAspectRatio } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-row gap-3 items-start">
    <VyAspectRatio :ratio="1" class="w-[100px] overflow-hidden rounded-lg bg-neutral-100">
      <view class="h-full w-full flex items-center justify-center">
        <text class="text-neutral-600">1:1</text>
      </view>
    </VyAspectRatio>
    <VyAspectRatio :ratio="4 / 3" class="w-[120px] overflow-hidden rounded-lg bg-neutral-100">
      <view class="h-full w-full flex items-center justify-center">
        <text class="text-neutral-600">4:3</text>
      </view>
    </VyAspectRatio>
  </view>
</template>
