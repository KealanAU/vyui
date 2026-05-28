<script setup lang="ts">
import { computed } from 'vue'
import { SURFACE, BORDER } from './tokens'

const props = withDefaults(defineProps<{
  gap?: string
  padding?: string
  radius?: string
  shadow?: boolean
}>(), {
  gap: '14px',
  padding: '18px',
  radius: '14px',
  shadow: false,
})

const style = computed(() => ({
  backgroundColor: SURFACE,
  borderRadius: props.radius,
  borderWidth: '1px',
  borderColor: BORDER,
  padding: props.padding,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  gap: props.gap,
  ...(props.shadow ? { boxShadow: '0px 1px 4px rgba(15, 23, 42, 0.05)' } : {}),
}))
</script>

<template>
  <view :style="style">
    <slot />
  </view>
</template>
