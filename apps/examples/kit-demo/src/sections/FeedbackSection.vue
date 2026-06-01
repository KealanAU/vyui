<script setup lang="ts">
import { ToastProvider } from '@vyui/core'
import { VyAlert, VyToast } from '@vyui/kit'
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
  </view>
</template>
