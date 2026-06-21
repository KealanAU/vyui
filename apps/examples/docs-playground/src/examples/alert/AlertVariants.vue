<script setup lang="ts">
import { VyAlert } from '@vyui/kit'
</script>

<template>
  <view class="flex flex-col gap-3 w-[320px]">
    <VyAlert title="Solid" description="Filled semantic surface." color="primary" variant="solid" />
    <VyAlert title="Soft" description="Light semantic surface." color="success" variant="soft" />
    <VyAlert title="Outline" description="Bordered surface." color="warning" variant="outline" />
    <VyAlert title="Subtle" description="Low-emphasis surface." color="error" variant="subtle" />
  </view>
</template>
