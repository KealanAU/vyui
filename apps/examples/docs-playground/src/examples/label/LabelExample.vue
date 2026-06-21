<script setup lang="ts">
import { ref } from 'vue'
import { VyInput, VyLabel } from '@vyui/kit'

const name = ref('')
</script>

<template>
  <view class="flex flex-col gap-2 w-full">
    <VyLabel for="display-name">Display name</VyLabel>
    <VyInput
      id="display-name"
      v-model="name"
      placeholder="Ada Lovelace"
    />
  </view>
</template>
