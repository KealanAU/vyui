<script setup lang="ts">
import { computed } from 'vue'
import { issues } from '../data/issues'
import IssueRow from './IssueRow.vue'

const groups = computed(() => {
  const active = issues.filter(i => i.status !== 'done')
  const done = issues.filter(i => i.status === 'done')
  return [
    { label: 'Active',    count: active.length, items: active },
    { label: 'Completed', count: done.length,   items: done   },
  ]
})
</script>

<template>
  <view class="flex flex-col gap-3">
    <view v-for="group in groups" :key="group.label" class="flex flex-col">
      <view class="flex flex-row items-center gap-2 px-4 pt-3 pb-2">
        <text class="text-slate-700 text-xs font-semibold uppercase tracking-wide">{{ group.label }}</text>
        <text class="text-slate-400 text-xs">{{ group.count }}</text>
      </view>
      <view class="border-t border-b border-slate-100">
        <IssueRow v-for="issue in group.items" :key="issue.id" :issue="issue" />
      </view>
    </view>
  </view>
</template>
