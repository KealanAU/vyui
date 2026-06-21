<script setup lang="ts">
import { ref } from 'vue'
import { VySwiper } from '@vyui/kit'

const current = ref(0)
const slides = [
  { title: 'Explore', description: 'Find something new.' },
  { title: 'Save', description: 'Keep favorites close.' },
  { title: 'Share', description: 'Send them to friends.' },
]
</script>

<template>
  <VySwiper
    v-model="current"
    :items="slides"
    show-indicators
    class="w-full"
  >
    <template #item="{ item, index }">
      <view class="h-48 p-6 bg-neutral-100">
        <text class="text-xl font-semibold">{{ item.title }}</text>
        <text class="mt-2 text-neutral-600">{{ item.description }}</text>
        <text class="mt-4 text-sm text-neutral-500">Slide {{ index + 1 }}</text>
      </view>
    </template>
  </VySwiper>
</template>
