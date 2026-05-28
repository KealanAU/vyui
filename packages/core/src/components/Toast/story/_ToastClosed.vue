<script setup lang="ts">
import { ToastProvider, ToastRoot } from '..'
</script>

<template>
  <ToastProvider>
    <template #default="{ count }">
      <ToastRoot :default-open="false" data-testid="toast">
        <text>body</text>
      </ToastRoot>
      <text data-testid="count">{{ count }}</text>
    </template>
  </ToastProvider>
</template>
