<script setup lang="ts">
import { VyProgress } from '@vyui/kit'
</script>

<template>
  <view class="w-[320px]">
    <VyProgress :model-value="42" :max="60" status color="success" />
  </view>
</template>
