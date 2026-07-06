<script setup lang="ts">
import { VyButton } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton disabled label="Disabled" />
    <VyButton disabled icon="i-lucide-lock" label="Locked" color="neutral" variant="outline" />
    <VyButton disabled loading label="Saving" color="neutral" variant="soft" />
  </view>
</template>
