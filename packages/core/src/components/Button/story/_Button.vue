<script setup lang="ts">
import { Button } from '..'

defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  tap: []
}>()
</script>

<template>
  <view>
    <Button :disabled="disabled" data-testid="btn" @tap="$emit('tap')">
      <template #default="{ active, disabled: d }">
        <text :data-testid="active ? 'active' : 'idle'" :data-disabled="d">
          {{ active ? 'pressed' : 'idle' }}
        </text>
      </template>
    </Button>
  </view>
</template>
