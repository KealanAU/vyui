<script setup lang="ts">
import { VyButton } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton class="rounded-full px-5" label="Rounded" />
    <VyButton
      icon="i-lucide-rocket"
      color="neutral"
      variant="outline"
      label="Slot override"
      :ui="{
        label: 'text-primary-600 font-semibold',
        leadingIcon: 'size-6',
      }"
    />
  </view>
</template>
