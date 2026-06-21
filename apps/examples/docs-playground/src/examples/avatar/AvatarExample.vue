<script setup lang="ts">
import { VyAvatar } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-row gap-3 items-center">
    <VyAvatar text="KC" color="primary" />
    <VyAvatar alt="Ada Lovelace" color="secondary" />
    <VyAvatar icon="i-lucide-user" color="neutral" />
  </view>
</template>
