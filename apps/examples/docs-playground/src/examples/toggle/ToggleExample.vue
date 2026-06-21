<script setup lang="ts">
import { ref } from 'vue'
import { VyToggle } from '@vyui/kit'

const bold = ref(false)
const italic = ref(true)
const underline = ref(false)
</script>

<template>
  <view class="flex flex-row gap-2">
    <VyToggle v-model="bold" icon="i-lucide-bold" accessibility-label="Bold" />
    <VyToggle v-model="italic" icon="i-lucide-italic" accessibility-label="Italic" />
    <VyToggle v-model="underline" icon="i-lucide-underline" accessibility-label="Underline" />
  </view>
</template>
