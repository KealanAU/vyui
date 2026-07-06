<script setup lang="ts">
import { VyButton } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <view class="flex flex-row flex-wrap justify-center gap-2">
      <VyButton icon="i-lucide-rocket" label="Launch" />
      <VyButton trailing-icon="i-lucide-arrow-right" label="Next" />
      <VyButton leading-icon="i-lucide-arrow-left" label="Back" color="neutral" variant="outline" />
    </view>

    <view class="flex flex-row flex-wrap justify-center gap-2">
      <VyButton icon="i-lucide-search" accessibility-label="Search" />
      <VyButton
        icon="i-lucide-plus"
        color="neutral"
        variant="soft"
        accessibility-label="Create"
      />
      <VyButton
        :avatar="{ src: 'https://github.com/nuxt.png', alt: 'Nuxt' }"
        label="Nuxt"
        color="neutral"
        variant="outline"
      />
    </view>
  </view>
</template>
