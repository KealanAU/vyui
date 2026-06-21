<script setup lang="ts">
import { ref } from 'vue'
import { VyIcon, VyInput } from '@vyui/kit'
import { useSettings } from '../composables/useSettings'

// Settings sheet — opened from the sidebar's Settings row. Lets the user paste
// an Anthropic / OpenAI API key (held in memory only) so the brand models in the
// picker talk to the real APIs. The "Sign in" buttons are decorative: OpenAI has
// no consumer OAuth for API access and Anthropic's is first-party only, so a
// client-only demo can't run a real flow — paste a key instead.
const { anthropicKey, openaiKey, open, closeSettings } = useSettings()

// Inline note shown when a (decorative) OAuth button is tapped.
const oauthNote = ref('')
function fauxOAuth(label: string) {
  oauthNote.value = `${label} sign-in is coming soon — paste an API key below for now.`
}

// Keyboard lift — same pattern as the composer: grow a spacer below the panel
// by the keyboard height so the flex column pushes the panel up. The global
// keyboard event doesn't reach the vue-lynx runtime, so we read VyInput's
// normalized @keyboard instead.
const kbHeight = ref(0)
function onKeyboard(info: { visible: boolean, height: number }) {
  kbHeight.value = info?.visible ? info.height : 0
}
</script>

<template>
  <!-- Full-screen overlay above everything (the shell sits at z-1). Children
       stack to the bottom; the keyboard spacer lifts the panel. -->
  <view v-if="open" class="absolute inset-0 z-[60] flex flex-col justify-end">
    <!-- Scrim — tap to dismiss. -->
    <view class="absolute inset-0 bg-black/30" @tap="closeSettings" />

    <!-- Sheet panel. -->
    <view class="relative bg-white rounded-t-3xl px-5 pt-4 pb-8">
      <!-- Grabber + header. -->
      <view class="w-10 h-1 rounded-full bg-slate-200 self-center mb-4" />
      <view class="flex flex-row items-center mb-5">
        <text class="flex-1 text-slate-900 text-lg font-semibold">Settings</text>
        <view
          class="size-9 rounded-full flex items-center justify-center active:bg-slate-100"
          @tap="closeSettings"
        >
          <VyIcon name="i-tabler-x" :size="20" color="#334155" />
        </view>
      </view>

      <text class="text-slate-500 text-[13px] mb-5">
        Add a key to chat with the real models. Keys are kept in memory only and
        cleared when the app reloads.
      </text>

      <!-- Anthropic / Claude -->
      <view class="flex flex-col gap-2 mb-5">
        <view class="flex flex-row items-center gap-2">
          <VyIcon name="i-logos-claude-icon" :size="18" />
          <text class="text-slate-900 text-sm font-medium">Anthropic (Claude)</text>
        </view>
        <VyInput
          v-model="anthropicKey"
          type="password"
          placeholder="sk-ant-..."
          class="w-full"
          @keyboard="onKeyboard"
        />
        <view
          class="flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl border border-ash-border active:bg-slate-50"
          @tap="fauxOAuth('Anthropic')"
        >
          <VyIcon name="i-logos-claude-icon" :size="16" />
          <text class="text-slate-700 text-sm font-medium">Sign in with Anthropic</text>
        </view>
      </view>

      <!-- OpenAI -->
      <view class="flex flex-col gap-2 mb-3">
        <view class="flex flex-row items-center gap-2">
          <VyIcon name="i-logos-openai-icon" :size="18" />
          <text class="text-slate-900 text-sm font-medium">OpenAI (GPT-5)</text>
        </view>
        <VyInput
          v-model="openaiKey"
          type="password"
          placeholder="sk-..."
          class="w-full"
          @keyboard="onKeyboard"
        />
        <view
          class="flex flex-row items-center justify-center gap-2 py-2.5 rounded-xl border border-ash-border active:bg-slate-50"
          @tap="fauxOAuth('OpenAI')"
        >
          <VyIcon name="i-logos-openai-icon" :size="16" />
          <text class="text-slate-700 text-sm font-medium">Sign in with OpenAI</text>
        </view>
      </view>

      <text v-if="oauthNote" class="text-slate-400 text-xs mb-3">{{ oauthNote }}</text>

      <!-- Done -->
      <view
        class="flex flex-row items-center justify-center py-3 rounded-2xl bg-slate-900 active:bg-slate-700 mt-2"
        @tap="closeSettings"
      >
        <text class="text-white text-[15px] font-semibold">Done</text>
      </view>
    </view>

    <!-- Keyboard spacer — lifts the panel above the keyboard. -->
    <view :style="{ height: `${kbHeight}px` }" />
  </view>
</template>
