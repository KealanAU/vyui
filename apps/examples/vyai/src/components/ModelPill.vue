<script setup lang="ts">
import { VyIcon, VySwitch } from '@vyui/kit'
import type { Model } from '../data/chat'
import VyMark from './VyMark.vue'

// The little model-selector pill parked under the composer input. Reports taps
// via `tap`; the chevron flips when the picker is open. Sits on the same
// sunken surface as the sidebar so they read as one tone.
//
// When the selected model supports reasoning (`canThink`), a compact "Think"
// toggle rides on the right of the same row — out of the model menu, where it
// only matters for local models.
defineProps<{
  model: Model
  open: boolean
  canThink?: boolean
  thinking?: boolean
}>()

defineEmits<{
  tap: []
  'toggle-think': [on: boolean]
}>()
</script>

<template>
  <view class="flex flex-row items-center w-full pl-1.5 gap-2">
    <view
      class="flex flex-row items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-parchment-sunken active:bg-ash-border"
      @tap="$emit('tap')"
    >
      <!-- Brand models (Claude / OpenAI) wear their own mark — Claude keeps its
           baked clay colour; the house model wears the vyui mark. -->
      <VyIcon v-if="model.icon.startsWith('i-logos-')" :name="model.icon" :size="18" />
      <VyMark v-else :size="18" variant="square" />
      <text class="text-slate-700 text-[13px] font-medium">{{ model.name }}</text>
      <VyIcon
        :name="open ? 'i-tabler-chevron-down' : 'i-tabler-chevron-up'"
        :size="14"
        color="#94a3b8"
      />
    </view>

    <view class="flex-1" />

    <!-- Reasoning switch — basic on/off, "Thinking" label alongside. Only for
         models that support it. -->
    <view v-if="canThink" class="flex flex-row items-center gap-2 pr-1">
      <text class="text-slate-600 text-[13px] font-medium">Thinking</text>
      <VySwitch
        :model-value="thinking"
        size="sm"
        :ui="{ base: thinking ? 'bg-black' : '' }"
        @update:model-value="$emit('toggle-think', $event)"
      />
    </view>
  </view>
</template>
