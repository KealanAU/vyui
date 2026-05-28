<script setup lang="ts">
import { computed } from 'vue'
import { TEXT_MUTED, TEXT_PRIMARY } from './tokens'

const props = withDefaults(defineProps<{
  variant?: 'caption' | 'prominent'
}>(), {
  variant: 'caption',
})

const style = computed(() =>
  props.variant === 'prominent'
    ? { fontSize: '13px', fontWeight: '700' as const, color: TEXT_PRIMARY }
    : { fontSize: '11px', fontWeight: '700' as const, color: TEXT_MUTED, letterSpacing: '0.6px' },
)
</script>

<template>
  <text :style="style"><slot /></text>
</template>
