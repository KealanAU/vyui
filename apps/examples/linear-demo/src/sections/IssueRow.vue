<script setup lang="ts">
import { computed, ref } from 'vue'
import { VyAvatar, VyBadge } from '@vyui/kit'
import { Icon as VyIcon } from '@vyui/core'
import vyuiIcon from '../assets/vyui-icon.png'
import { type Issue, priorityMeta, resolveDescription, statusMeta } from '../data/issues'

const props = defineProps<{ issue: Issue }>()

const priority = computed(() => priorityMeta[props.issue.priority])
const status = computed(() => statusMeta[props.issue.status])
const isVyui = computed(() => props.issue.assignee === 'vyui')

// Tap-to-expand accordion. The detail body (description / badges / assignee)
// renders inline below the row instead of in a popover so it lives in the
// document flow. The popover treatment moves to NotificationsFeed where the
// floating-anchor presentation actually adds value.
const expanded = ref(false)
function toggle() { expanded.value = !expanded.value }
</script>

<template>
  <!-- When expanded the whole row gets a soft border + background so the
       open card pops out of the flat list. Left accent stripe in the
       priority color reinforces the "this is the active item" reading. -->
  <view
    class="flex flex-col border-b border-slate-100"
    :class="expanded
      ? 'bg-slate-50 border-l-2 border-l-slate-300 border-t border-t-slate-200 border-b-slate-200 shadow-sm'
      : 'bg-white border-l-2 border-l-transparent'"
    :data-state="expanded ? 'open' : 'closed'"
  >
    <!-- Row header — compact summary. Tap toggles expand. -->
    <view class="flex flex-row items-center gap-3 px-4 py-3" @tap="toggle">
      <VyIcon :name="priority.icon" :class="['w-4 h-4', priority.color]" />
      <VyIcon :name="status.icon" :class="['w-4 h-4', status.color]" />
      <text class="text-slate-400 text-[11px] font-mono w-16 shrink-0">{{ issue.id }}</text>
      <view class="flex-1 min-w-0">
        <text class="text-slate-900 text-sm font-medium truncate">{{ issue.title }}</text>
        <text class="text-slate-500 text-xs">{{ issue.project }} · {{ status.label }}</text>
      </view>
      <text class="text-slate-400 text-xs w-8 text-right">{{ issue.updated }}</text>
      <VyAvatar v-if="isVyui" :src="vyuiIcon" alt="vyui" size="xs" />
      <VyAvatar v-else :alt="issue.assignee" size="xs" />
    </view>

    <!-- Expanded detail body — hosts the content the popover used to show.
         Inner border on the top edge plus padding so the body reads as a
         distinct card section rather than blending into the row above. -->
    <view v-if="expanded" class="flex flex-col gap-2 px-4 pb-3 pt-3 border-t border-slate-200">
      <view class="flex flex-row items-center gap-2">
        <text class="text-slate-400 text-[11px] font-mono">{{ issue.id }}</text>
        <text class="text-slate-400 text-xs">·</text>
        <text class="text-slate-500 text-xs">{{ issue.project }}</text>
        <text class="text-slate-400 text-xs ml-auto">{{ issue.updated }} ago</text>
      </view>

      <view class="flex flex-row flex-wrap items-center gap-2">
        <VyBadge size="sm" variant="soft" :label="status.label" :leading-icon="status.icon" />
        <VyBadge size="sm" variant="soft" color="error" :label="priority.label" :leading-icon="priority.icon" />
      </view>

      <text class="text-slate-700 text-xs">{{ resolveDescription(issue) }}</text>

      <view class="flex flex-row items-center gap-2 pt-1">
        <text class="text-slate-500 text-xs">Assignee</text>
        <VyAvatar v-if="isVyui" :src="vyuiIcon" alt="vyui" size="xs" />
        <VyAvatar v-else :alt="issue.assignee" size="xs" />
        <text class="text-slate-700 text-xs">{{ issue.assignee }}</text>
      </view>
    </view>
  </view>
</template>
