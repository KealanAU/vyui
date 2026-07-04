<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyButton, VyToast } from '@vyui/kit'

// Bump the key to remount a fresh toast so its timer (and the draining
// progress bar) restart from full on every tap.
const shown = ref(0)
</script>

<template>
  <ToastProvider :duration="6000">
    <VyButton label="Show toast" icon="i-lucide-bell" @tap="shown++" />

    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        :key="shown"
        color="neutral"
        title="Saving changes…"
        description="Watch the bar go green → amber → red as it drains."
        icon="i-lucide-loader"
        :progress="{ color: (p) => p > 0.5 ? 'success' : p > 0.25 ? 'warning' : 'error' }"
        :close="false"
      />
    </ToastViewport>
  </ToastProvider>
</template>
