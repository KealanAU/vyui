<script setup lang="ts">
import { VyButton, VyIcon } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton color="success" variant="soft">
      <view class="flex flex-row items-center gap-2">
        <text class="font-medium text-success-600">Synced</text>
        <text class="rounded-full bg-success-100 px-2 py-0.5 text-xs text-success-700">12</text>
      </view>
    </VyButton>

    <VyButton label="Deploy" variant="outline">
      <template #leading="{ iconColor }">
        <VyIcon name="i-lucide-cloud-upload" :color="iconColor" class="size-5" />
      </template>
      <template #trailing="{ iconColor }">
        <VyIcon name="i-lucide-arrow-up-right" :color="iconColor" class="size-5" />
      </template>
    </VyButton>
  </view>
</template>
