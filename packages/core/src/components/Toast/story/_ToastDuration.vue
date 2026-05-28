<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastRoot } from '..'

defineProps<{ duration: number }>()

const lastOpenEvent = ref<boolean | null>(null)
function onUpdateOpen(v: boolean) {
  lastOpenEvent.value = v
}
</script>

<template>
  <ToastProvider>
    <template #default="{ expanded, count, expand, collapse }">
      <ToastRoot :duration="duration" data-testid="toast" @update:open="onUpdateOpen">
        <text>body</text>
      </ToastRoot>
      <view data-testid="expand-btn" @tap="expand">
        <text>expand</text>
      </view>
      <view data-testid="collapse-btn" @tap="collapse">
        <text>collapse</text>
      </view>
      <text data-testid="expanded">{{ String(expanded) }}</text>
      <text data-testid="count">{{ count }}</text>
      <text data-testid="last-open-event">{{ lastOpenEvent === null ? '' : String(lastOpenEvent) }}</text>
    </template>
  </ToastProvider>
</template>
