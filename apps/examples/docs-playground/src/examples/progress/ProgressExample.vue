<script setup lang="ts">
import { ref } from 'vue'
import { VyProgress } from '@vyui/kit'

const uploaded = ref(68)
</script>

<template>
  <view class="w-[320px]">
    <VyProgress v-model="uploaded" :max="100" />
  </view>
</template>
