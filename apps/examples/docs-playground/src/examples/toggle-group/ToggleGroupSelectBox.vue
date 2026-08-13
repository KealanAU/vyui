<script setup lang="ts">
import { ref } from 'vue'
import { VyIcon, VyToggleGroup } from '@vyui/kit'

const plan = ref('pro')
const plans = [
  { label: 'Starter', value: 'starter', description: 'Up to 3 projects' },
  { label: 'Pro', value: 'pro', description: 'Unlimited projects and history' },
  { label: 'Team', value: 'team', description: 'Shared workspaces and roles' },
]
</script>

<template>
  <VyToggleGroup
    v-model="plan"
    type="single"
    orientation="vertical"
    :items="plans"
    :ui="{ root: 'gap-2 space-y-0', item: 'rounded-md p-4' }"
  >
    <template #default="{ item, iconColor }">
      <view class="flex flex-row items-center justify-between w-full">
        <view class="flex flex-col">
          <text class="font-medium text-default group-ui-on:text-primary-600">
            {{ item.label }}
          </text>
          <text class="text-xs text-muted">
            {{ item.description }}
          </text>
        </view>
        <VyIcon
          v-if="plan === item.value"
          name="i-lucide-check"
          :size="20"
          :color="iconColor"
        />
      </view>
    </template>
  </VyToggleGroup>
</template>
