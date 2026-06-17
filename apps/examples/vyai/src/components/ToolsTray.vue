<script setup lang="ts">
import { VyIcon } from '@vyui/kit'
import type { Tool } from '../data/chat'

// The "+" quick-tools tray shown in the composer's island panel. Tools are
// passed in; taps bubble up by label. Voice mode is its own affordance so it
// gets a dedicated `voice` emit rather than masquerading as a tool.
defineProps<{
  tools: Tool[]
}>()

const emit = defineEmits<{
  select: [label: string]
  voice: []
}>()
</script>

<template>
  <view class="flex flex-col gap-1 min-w-[14rem] py-1">
    <view
      v-for="t in tools"
      :key="t.label"
      class="flex flex-row items-center gap-3 px-3 py-2.5 rounded-xl active:bg-slate-100"
      @tap="emit('select', t.label)"
    >
      <VyIcon :name="t.icon" :size="22" color="#334155" />
      <text class="text-slate-900 text-sm font-medium">{{ t.label }}</text>
    </view>
    <view
      class="flex flex-row items-center gap-3 px-3 py-2.5 rounded-xl active:bg-slate-100"
      @tap="emit('voice')"
    >
      <VyIcon name="i-tabler-microphone" :size="22" color="#334155" />
      <text class="text-slate-900 text-sm font-medium">Voice mode</text>
    </view>
  </view>
</template>
