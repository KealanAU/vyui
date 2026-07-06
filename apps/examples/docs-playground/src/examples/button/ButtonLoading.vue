<script setup lang="ts">
import { ref } from 'vue'
import { VyButton } from '@vyui/kit'

const loading = ref(false)

function submit() {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1200)
}
</script>

<template>
  <view class="flex flex-col items-center gap-3">
    <VyButton :loading="loading" label="Submit" @tap="submit" />
    <VyButton loading label="Loading" color="neutral" variant="soft" />
    <VyButton loading loading-icon="i-lucide-loader" label="Custom icon" variant="outline" />
  </view>
</template>
