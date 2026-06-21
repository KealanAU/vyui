<script setup lang="ts">
import { ref } from 'vue'
import { VyInput } from '@vyui/kit'

const a = ref('')
const b = ref('')
const c = ref('')
</script>

<template>
  <view class="flex flex-col gap-3 w-[280px]">
    <VyInput v-model="a" variant="outline" placeholder="Outline" />
    <VyInput v-model="b" variant="soft" placeholder="Soft" />
    <VyInput v-model="c" color="error" highlight placeholder="Highlighted error" />
  </view>
</template>
