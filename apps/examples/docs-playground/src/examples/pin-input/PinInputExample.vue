<script setup lang="ts">
import { ref } from 'vue'
import { VyPinInput } from '@vyui/kit'

const code = ref('')
</script>

<template>
  <view class="flex flex-col gap-2 items-center">
    <VyPinInput v-model="code" :length="4" type="numeric" />
    <text class="text-sm text-muted">Entered: {{ code || '—' }}</text>
  </view>
</template>
