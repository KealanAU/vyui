<script setup lang="ts">
import { TEXT_SECONDARY } from './tokens'

const props = defineProps<{ color: string }>()

const row = {
  display: 'flex' as const,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: '10px',
}
const swatch = computed(() => ({
  width: '24px',
  height: '24px',
  borderRadius: '6px',
  backgroundColor: props.color,
}))
const text = { fontSize: '13px', fontWeight: '600' as const, color: TEXT_SECONDARY }
</script>

<template>
  <view :style="row">
    <view :style="swatch" />
    <text :style="text">{{ color }}</text>
  </view>
</template>
