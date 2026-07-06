<script setup lang="ts">
import { VyButton } from '@vyui/kit'

const variants = ['solid', 'outline', 'subtle', 'soft', 'ghost', 'link'] as const
</script>

<template>
  <view class="flex flex-col gap-3 w-[320px]">
    <view
      v-for="variant in variants"
      :key="variant"
      class="flex flex-row items-center justify-between gap-3"
    >
      <text class="w-20 text-sm capitalize text-neutral-600">{{ variant }}</text>
      <VyButton color="primary" :variant="variant" :label="variant" />
      <VyButton color="neutral" :variant="variant" :label="variant" />
    </view>
  </view>
</template>
