<script setup lang="ts">
import { ref } from 'vue'
import { VySlider } from '@vyui/kit'

const volume = ref(40)
</script>

<template>
  <view class="flex flex-col gap-2 w-full">
    <text class="text-sm text-muted">Volume: {{ volume }}</text>
    <VySlider v-model="volume" :min="0" :max="100" />
  </view>
</template>
