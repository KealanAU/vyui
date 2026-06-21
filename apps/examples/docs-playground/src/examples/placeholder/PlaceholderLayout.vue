<script setup lang="ts">
import { VyPlaceholder } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col gap-4 w-[320px]">
    <VyPlaceholder class="h-16 w-full" />

    <view class="flex flex-row gap-4">
      <VyPlaceholder class="size-24 shrink-0" />
      <VyPlaceholder class="h-24 flex-1" />
    </view>

    <VyPlaceholder class="h-32 w-full rounded-xl" />
  </view>
</template>
