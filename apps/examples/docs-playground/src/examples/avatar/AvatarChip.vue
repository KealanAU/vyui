<script setup lang="ts">
import { VyAvatar } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-row gap-3 items-center">
    <VyAvatar text="ON" color="neutral" :chip="{ color: 'success', position: 'bottom-right' }" />
    <VyAvatar text="AW" color="neutral" :chip="{ color: 'warning', position: 'top-right' }" />
  </view>
</template>
