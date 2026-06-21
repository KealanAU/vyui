<script setup lang="ts">
import { ref } from 'vue'
import { VySlider } from '@vyui/kit'

const price = ref([20, 80])
</script>

<template>
  <view class="flex flex-col gap-2 w-full">
    <text class="text-sm text-muted">${{ price[0] }} – ${{ price[1] }}</text>
    <VySlider v-model="price" :min="0" :max="100" />
  </view>
</template>
