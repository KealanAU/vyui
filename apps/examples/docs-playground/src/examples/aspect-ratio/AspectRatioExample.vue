<script setup lang="ts">
import { VyAspectRatio } from '@vyui/kit'
</script>

<template>
  <VyAspectRatio :ratio="16 / 9" class="w-[320px] overflow-hidden rounded-xl bg-primary-100">
    <view class="h-full w-full flex items-center justify-center">
      <text class="text-primary-600">16 / 9</text>
    </view>
  </VyAspectRatio>
</template>
