<script setup lang="ts">
import { ref } from 'vue'
import { VyLabel, VyNumberField } from '@vyui/kit'

const quantity = ref<number | null>(1)
</script>

<template>
  <view class="flex flex-col gap-2">
    <VyLabel for="quantity">Quantity</VyLabel>
    <VyNumberField id="quantity" v-model="quantity" :min="0" :max="10" />
  </view>
</template>
