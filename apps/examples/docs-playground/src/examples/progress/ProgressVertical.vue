<script setup lang="ts">
import { VyProgress } from '@vyui/kit'
</script>

<template>
  <view class="h-48">
    <VyProgress
      :model-value="65"
      orientation="vertical"
      inverted
      size="lg"
      color="warning"
      status
    />
  </view>
</template>
