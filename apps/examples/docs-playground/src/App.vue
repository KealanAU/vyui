<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { examples } from './examples'

// The docs host selects which example to mount via `global-props`. On the
// background thread that lands on `lynx.__globalProps`; read it once at setup.
// Falls back to the first registered example when opened standalone.
const requested = shallowRef<string>(
  (typeof lynx !== 'undefined' && lynx.__globalProps?.example)
  || Object.keys(examples)[0]
  || '',
)

const current = computed(() => examples[requested.value])
</script>

<template>
  <view class="flex items-center justify-center w-full min-h-screen p-6 bg-transparent">
    <component :is="current" v-if="current" />
    <text v-else class="text-sm text-red-500">Unknown example: {{ requested }}</text>
  </view>
</template>
