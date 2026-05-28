<script setup lang="ts">
import { computed } from 'vue'
import { ACCENT, ACCENT_LIGHT, TEXT_SECONDARY, HAIRLINE } from './tokens'

const props = withDefaults(defineProps<{
  tone?: 'neutral' | 'accent'
  color?: string
  background?: string
}>(), {
  tone: 'neutral',
})

const style = computed(() => ({
  alignSelf: 'flex-start' as const,
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '6px',
  paddingBottom: '6px',
  borderRadius: '20px',
  backgroundColor: props.background ?? (props.tone === 'accent' ? ACCENT_LIGHT : HAIRLINE),
}))

const textStyle = computed(() => ({
  fontSize: '13px',
  fontWeight: '600' as const,
  color: props.color ?? (props.tone === 'accent' ? ACCENT : TEXT_SECONDARY),
}))
</script>

<template>
  <view :style="style">
    <text :style="textStyle"><slot /></text>
  </view>
</template>
