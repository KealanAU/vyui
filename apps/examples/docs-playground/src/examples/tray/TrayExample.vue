<script setup lang="ts">
import { ref } from 'vue'
import { VyButton, VyTray, VyTrayView } from '@vyui/kit'

const open = ref(false)
</script>

<template>
  <VyTray v-model:open="open" default-view="menu">
    <template #trigger>
      <VyButton color="neutral" variant="subtle" label="Open tray" />
    </template>

    <template #default="{ setView, goBack, canGoBack }">
      <VyTrayView id="menu">
        <view class="flex flex-col gap-2">
          <text class="text-slate-900 text-base font-semibold">Quick actions</text>
          <VyButton color="neutral" variant="soft" label="Share" @tap="setView('share')" />
          <VyButton color="error" variant="soft" label="Delete" @tap="setView('confirm')" />
        </view>
      </VyTrayView>

      <VyTrayView id="share">
        <view class="flex flex-col gap-2">
          <VyButton v-if="canGoBack" color="neutral" variant="ghost" size="sm" label="← Back" @tap="goBack()" />
          <text class="text-slate-900 text-base font-semibold">Share</text>
          <text class="text-slate-600 text-sm">A taller view — the tray grows to fit it. Anyone with the link can view; toggle access or invite by email.</text>
        </view>
      </VyTrayView>

      <VyTrayView id="confirm">
        <view class="flex flex-col gap-2">
          <VyButton v-if="canGoBack" color="neutral" variant="ghost" size="sm" label="← Back" @tap="goBack()" />
          <text class="text-slate-900 text-base font-semibold">Delete item?</text>
          <text class="text-slate-500 text-sm">A short view — the tray shrinks down.</text>
        </view>
      </VyTrayView>
    </template>

    <template #footer="{ close }">
      <VyButton color="neutral" variant="solid" label="Close" block @tap="close()" />
    </template>
  </VyTray>
</template>
