<script setup lang="ts">
import { ref } from 'vue'
import { VyIcon, VySortable } from '@vyui/kit'

const tasks = ref([
  { id: 'design', label: 'Design the screen' },
  { id: 'build', label: 'Build the interaction' },
  { id: 'test', label: 'Test on device' },
  { id: 'ship', label: 'Ship the release' },
])
</script>

<template>
  <VySortable v-model="tasks" class="w-full">
    <template #item="{ item, index }">
      <view class="flex min-w-0 flex-1 flex-row items-center gap-3">
        <VyIcon name="i-lucide-grip-vertical" class="shrink-0 text-neutral-400" />
        <text class="min-w-0 flex-1">{{ index + 1 }}. {{ item.label }}</text>
      </view>
    </template>
  </VySortable>
</template>
