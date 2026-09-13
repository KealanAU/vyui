<script setup lang="ts">
import { ref } from 'vue'
import { OverlayRoot, ToastProvider } from '@vyui/core'
import { VyButton } from '@vyui/kit/button'

const count = ref(0)
</script>

<template>
  <ToastProvider>
    <view class="flex flex-col items-center justify-center w-full min-h-screen gap-4 px-6 bg-white">
      <text class="text-2xl font-bold text-slate-900">Hello Vy UI</text>
      <text class="text-sm text-slate-500">Styled kit component, working first run.</text>

      <VyButton @tap="count++">Tapped {{ count }} times</VyButton>
    </view>
  </ToastProvider>
  <!-- Portal host for overlays (Modal, Drawer, Popover, Toast viewport);
       keep it a sibling at the app root. -->
  <OverlayRoot />
</template>
