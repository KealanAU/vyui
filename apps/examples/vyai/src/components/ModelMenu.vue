<script setup lang="ts">
import { VyIcon } from '@vyui/kit'
import type { Model } from '../data/chat'

// The model-picker list shown in the composer's island panel. Takes the list
// + current selection as props; reports the chosen id via `select`. The parent
// owns the model state and what "selecting" does (set + close the panel).
defineProps<{
  models: Model[]
  selectedId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <view class="flex flex-col gap-1 min-w-[15rem] py-1">
    <text class="text-slate-400 text-xs font-medium px-3 pb-1">Choose a model</text>
    <view
      v-for="m in models"
      :key="m.id"
      class="flex flex-row items-center gap-3 px-3 py-2.5 rounded-xl active:bg-slate-100"
      @tap="emit('select', m.id)"
    >
      <VyIcon :name="m.icon" :size="20" color="#334155" />
      <view class="flex-1 flex flex-col">
        <text class="text-slate-900 text-sm font-medium">{{ m.name }}</text>
        <text class="text-slate-400 text-xs">{{ m.blurb }}</text>
      </view>
      <VyIcon
        v-if="m.id === selectedId"
        name="i-tabler-check"
        :size="18"
        color="#3b82f6"
      />
    </view>
  </view>
</template>
