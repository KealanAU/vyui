<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyButton, VyToast } from '@vyui/kit'

const visible = ref(false)
</script>

<template>
  <ToastProvider :duration="4000">
    <VyButton label="Show toast" icon="i-lucide-bell" @tap="visible = true" />

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
