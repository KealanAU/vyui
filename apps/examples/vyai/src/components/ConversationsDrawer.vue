<script setup lang="ts">
import { VyIcon } from '@vyui/kit'
import { useChat } from '../composables/useChat'
import { useDrawer } from '../composables/useDrawer'
import { useSettings } from '../composables/useSettings'
import VyMark from './VyMark.vue'

const { conversations, activeConversationId, newChat, openConversation } = useChat()
const { close } = useDrawer()
const { openSettings } = useSettings()

function startNewChat() {
  newChat()
  close()
}

// Slide the shell back, then float the settings sheet over everything.
function showSettings() {
  openSettings()
  close()
}

function pick(id: number) {
  openConversation(id)
  close()
}
</script>

<template>
  <!-- Under-sheet: pinned to the left and sitting BEHIND the main shell (see
       App.vue). It's permanently mounted but hidden — the opaque shell covers
       it until the burger slides the shell to the right to reveal it. Because
       it never floats above the shell, it can't intercept taps while closed
       (the bug the old overlay drawer had). -->
  <view class="vyai-undersheet flex flex-col">
    <!-- Header -->
    <view class="flex flex-row items-center gap-2.5 px-4 pt-[91px] pb-3">
      <VyMark :size="26" variant="square" />
      <text class="flex-1 text-slate-900 text-lg font-semibold">vyai</text>
      <view
        class="size-9 rounded-full flex items-center justify-center active:bg-slate-200"
        @tap="close"
      >
        <VyIcon name="i-tabler-x" :size="20" color="#334155" />
      </view>
    </view>

    <!-- New chat -->
    <view class="px-3 pb-2">
      <view
        class="flex flex-row items-center gap-2.5 px-3 py-2.5 rounded-xl active:bg-slate-200"
        @tap="startNewChat"
      >
        <VyIcon name="i-tabler-edit" :size="20" color="#334155" />
        <text class="text-slate-900 text-[15px] font-medium">New chat</text>
      </view>
    </view>

    <view class="h-px bg-slate-200 mx-3" />

    <!-- History -->
    <scroll-view class="flex-1 min-h-0" scroll-orientation="vertical">
      <view class="flex flex-col px-3 py-2">
        <text class="text-slate-400 text-xs font-medium px-3 pb-1">Recent</text>
        <view
          v-for="c in conversations"
          :key="c.id"
          class="flex flex-row items-center gap-2.5 px-3 py-2.5 rounded-xl active:bg-slate-200"
          :class="c.id === activeConversationId ? 'bg-slate-200' : ''"
          @tap="pick(c.id)"
        >
          <VyIcon name="i-tabler-message" :size="18" color="#64748b" />
          <text class="flex-1 text-slate-700 text-sm truncate">{{ c.title }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- Settings — pinned to the bottom of the sidebar. -->
    <view class="h-px bg-slate-200 mx-3" />
    <view class="px-3 py-2 pb-6">
      <view
        class="flex flex-row items-center gap-2.5 px-3 py-2.5 rounded-xl active:bg-slate-200"
        @tap="showSettings"
      >
        <VyIcon name="i-tabler-settings" :size="20" color="#334155" />
        <text class="text-slate-900 text-[15px] font-medium">Settings</text>
      </view>
    </view>
  </view>
</template>
