<script setup lang="ts">
import { VyButton } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col gap-3 w-[320px]">
    <VyButton block label="Create project" trailing-icon="i-lucide-arrow-right" />
    <view class="flex flex-row gap-2">
      <VyButton block color="neutral" variant="soft" label="Cancel" />
      <VyButton block label="Save" />
    </view>
    <view class="flex flex-row gap-2">
      <VyButton square icon="i-lucide-heart" accessibility-label="Favorite" />
      <VyButton square icon="i-lucide-share" color="neutral" variant="outline" accessibility-label="Share" />
      <VyButton square icon="i-lucide-trash-2" color="error" variant="soft" accessibility-label="Delete" />
    </view>
  </view>
</template>
