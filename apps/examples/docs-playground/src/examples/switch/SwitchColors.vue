<script setup lang="ts">
import { ref } from 'vue'
import { VySwitch } from '@vyui/kit'

const a = ref(true)
const b = ref(true)
const c = ref(false)
</script>

<template>
  <view class="flex flex-col gap-3">
    <VySwitch v-model="a" color="primary" label="Primary" />
    <VySwitch v-model="b" color="success" label="Success" />
    <VySwitch v-model="c" disabled label="Disabled" />
  </view>
</template>
