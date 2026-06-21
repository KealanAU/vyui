<script setup lang="ts">
import { ref } from 'vue'
import { VyRating } from '@vyui/kit'

const rating = ref(3)
</script>

<template>
  <view class="flex flex-col gap-2 items-center">
    <VyRating v-model="rating" />
    <text class="text-sm text-muted">{{ rating }} of 5</text>
  </view>
</template>
