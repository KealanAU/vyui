<script setup lang="ts">
import { VyToggle } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-row gap-2">
    <VyToggle disabled icon="i-lucide-star" accessibility-label="Favorite" />
    <VyToggle disabled :model-value="true" icon="i-lucide-star" accessibility-label="Favorite" />
  </view>
</template>
