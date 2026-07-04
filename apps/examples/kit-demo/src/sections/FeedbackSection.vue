<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyAlert, VyButton, VyToast } from '@vyui/kit'

// Live progress demo — flip the key to remount a fresh toast so its
// auto-dismiss timer (and the draining progress bar) restart from full.
const progressToast = ref(0)
function showProgressToast() {
  progressToast.value += 1
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Alert -->
    <view class="flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold px-1">Alert</text>
      <VyAlert
        color="info"
        icon="icon-park-outline:info"
        title="Heads up"
        description="Vy UI mirrors Nuxt UI v3's component API for Vue-Lynx."
      />
      <VyAlert
        color="success"
        variant="soft"
        icon="icon-park-outline:check-one"
        title="All set"
        description="Your changes have been saved."
      />
      <VyAlert
        color="warning"
        variant="outline"
        icon="icon-park-outline:caution"
        title="Watch out"
        description="This action cannot be undone."
      />
      <VyAlert
        color="error"
        variant="subtle"
        icon="icon-park-outline:close-one"
        title="Something went wrong"
        description="Try again in a moment."
      />
    </view>

    <!-- Toast (static showcase — wrap in ToastProvider so ToastRoot can inject context) -->
    <ToastProvider>
      <view class="flex flex-col gap-3">
        <text class="text-slate-900 text-base font-semibold px-1">Toast</text>
        <text class="text-slate-500 text-xs px-1">
          Static preview — add ToastViewport for runtime toasts.
        </text>
        <VyToast
          title="Profile updated"
          description="Your changes are now visible to the team."
          icon="icon-park-outline:check-one"
        />
        <VyToast
          color="error"
          title="Upload failed"
          description="Check your network and retry."
          icon="icon-park-outline:close-one"
        />
      </view>
    </ToastProvider>

    <!-- Runtime toast whose countdown bar recolors as it drains. `progress.color`
         takes a function of the remaining fraction (1 → 0), so the bar goes
         green → amber → red on the way out. Tapping remounts (via `:key`) so it
         restarts from full. -->
    <view class="flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold px-1">Toast progress color</text>
      <VyButton label="Show progress toast" color="neutral" variant="outline" @tap="showProgressToast" />
    </view>
    <ToastProvider v-if="progressToast" :duration="6000">
      <ToastViewport position="top" :style="{ top: '60px', zIndex: 60 }">
        <VyToast
          :key="progressToast"
          color="neutral"
          title="Saving changes…"
          description="This closes on its own — watch the bar go green → amber → red."
          icon="icon-park-outline:check-one"
          :progress="{ color: (p) => p > 0.5 ? 'success' : p > 0.25 ? 'warning' : 'error' }"
          :close="false"
        />
      </ToastViewport>
    </ToastProvider>
  </view>
</template>
