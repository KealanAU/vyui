<script setup lang="ts">
import { ref } from 'vue'
import { VyProgress } from '@vyui/kit'

const step = ref(1)
const steps = ['Details', 'Review', 'Payment', 'Complete']
</script>

<template>
  <view class="w-[320px]">
    <VyProgress v-model="step" :max="steps" color="primary" status>
      <template #step-1="{ step: label }">
        <text>Current: {{ label }}</text>
      </template>
    </VyProgress>
  </view>
</template>
