<script setup lang="ts">
import { LazyComponent } from '..'

defineProps<{
  pid?: string
  scene?: string
  unmountOnExit?: boolean
}>()
</script>

<template>
  <view>
    <LazyComponent
      :pid="pid ?? 'item-1'"
      :scene="scene ?? 'demo'"
      :estimated-style="{ width: '100%', height: '120px' }"
      :unmount-on-exit="unmountOnExit"
      data-testid="lazy"
    >
      <view data-testid="loaded">
        <text>loaded content</text>
      </view>
    </LazyComponent>
  </view>
</template>
