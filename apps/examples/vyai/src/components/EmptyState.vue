<script setup lang="ts">
import { VyIcon } from '@vyui/kit'
import type { Suggestion } from '../data/chat'
import VyMark from './VyMark.vue'

// Pure presentational: the greeting + prompt-chip grid for a fresh thread.
// State stays in the parent — this just renders props and reports taps.
defineProps<{
  modelName: string
  suggestions: Suggestion[]
}>()

const emit = defineEmits<{
  /** A chip was tapped — carries the prompt to send. */
  pick: [prompt: string]
}>()
</script>

<template>
  <view class="flex flex-col items-center justify-center pt-24 gap-6">
    <VyMark :size="64" variant="square" />
    <view class="flex flex-col items-center gap-1">
      <text class="text-slate-900 text-2xl font-semibold">What can I help with?</text>
      <text class="text-slate-400 text-sm">{{ modelName }} · a vyui demo</text>
    </view>

    <view class="flex flex-row flex-wrap justify-center gap-2 pt-2">
      <view
        v-for="s in suggestions"
        :key="s.label"
        class="flex flex-row items-center gap-2 px-4 py-2.5 rounded-2xl border border-ash-border bg-white active:bg-slate-50"
        @tap="emit('pick', s.prompt)"
      >
        <VyIcon :name="s.icon" :size="18" color="#64748b" />
        <text class="text-slate-700 text-sm">{{ s.label }}</text>
      </view>
    </view>
  </view>
</template>
