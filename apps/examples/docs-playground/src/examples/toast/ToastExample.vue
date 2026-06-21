<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyToast } from '@vyui/kit'

const visible = ref(true)
</script>

<template>
  <ToastProvider :duration="5000">
    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        v-if="visible"
        title="Changes saved"
        description="Your profile is up to date."
        icon="i-lucide-circle-check"
        color="success"
        progress
        @update:open="visible = $event"
      />
    </ToastViewport>
  </ToastProvider>
</template>
