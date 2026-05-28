<script setup lang="ts">
import { computed, ref } from 'vue'
import { VyAvatar, VyBadge, VyPopover, VySeparator } from '@vyui/kit'
import { Icon as VyIcon } from '@vyui/core'
import vyuiIcon from '../assets/vyui-icon.png'
import { kindMeta, notifications } from '../data/notifications'
import { issues } from '../data/issues'

const groups = computed(() => {
  const unread = notifications.filter(n => n.unread)
  const read = notifications.filter(n => !n.unread)
  return [
    { label: 'New',    count: unread.length, items: unread },
    { label: 'Earlier', count: read.length,  items: read },
  ]
})

// Look up the linked issue (if any) so the popover can surface its title +
// status rather than just echoing the notification message.
const issuesById = computed(() => {
  const map: Record<string, (typeof issues)[number]> = {}
  for (const i of issues) map[i.id] = i
  return map
})
function linkedIssue(issueId: string | undefined) {
  return issueId ? issuesById.value[issueId] : undefined
}

// One open popover at a time — the open id tracks which notification is
// showing its detail. Moves the longpress/popover treatment that used to
// live on issue rows onto notifications, where docked-anchor reads as a
// "peek detail" affordance.
const openId = ref<string | null>(null)
</script>

<template>
  <view class="flex flex-col gap-3">
    <view v-for="group in groups" :key="group.label" class="flex flex-col">
      <view class="flex flex-row items-center gap-2 px-4 pt-3 pb-2">
        <text class="text-slate-700 text-xs font-semibold uppercase tracking-wide">{{ group.label }}</text>
        <text class="text-slate-400 text-xs">{{ group.count }}</text>
      </view>
      <view class="border-t border-b border-slate-100">
        <VyPopover
          v-for="n in group.items"
          :key="n.id"
          presentation="anchor"
          :content="{ side: 'top', align: 'center', sideOffset: 8 }"
          :open="openId === n.id"
          @update:open="(v) => { openId = v ? n.id : null }"
        >
          <view class="flex flex-row items-start gap-3 px-4 py-3 border-b border-slate-100 bg-white">
            <view class="relative shrink-0">
              <VyAvatar
                v-if="n.actor === 'vyui' || n.actor === 'vyui-bot'"
                :src="vyuiIcon"
                :alt="n.actor"
                size="sm"
              />
              <VyAvatar v-else :alt="n.actor" size="sm" />
              <view
                v-if="n.unread"
                class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white"
              />
            </view>
            <view class="flex-1 min-w-0 flex flex-col gap-0.5">
              <view class="flex flex-row items-center gap-1.5">
                <VyIcon :name="kindMeta[n.kind].icon" :class="['w-3.5 h-3.5', kindMeta[n.kind].color]" />
                <text class="text-slate-900 text-sm font-medium">{{ n.actor }}</text>
                <text class="text-slate-400 text-xs">· {{ n.time }}</text>
              </view>
              <text class="text-slate-600 text-sm">{{ n.message }}</text>
              <text v-if="n.issueId" class="text-slate-400 text-[11px] font-mono">{{ n.issueId }}</text>
            </view>
          </view>

          <!-- Anchored peek — title + status + assignee of the linked issue,
               or the raw message body when no issue is linked. Same content
               density as the old IssueRow popover. -->
          <template #content>
            <view class="flex flex-col gap-2 px-4 py-3 w-80 max-w-[90vw]">
              <view class="flex flex-row items-center gap-2">
                <VyIcon :name="kindMeta[n.kind].icon" :class="['w-3.5 h-3.5', kindMeta[n.kind].color]" />
                <text class="text-slate-900 text-sm font-semibold">{{ n.actor }}</text>
                <text class="text-slate-400 text-xs ml-auto">{{ n.time }} ago</text>
              </view>

              <text class="text-slate-700 text-xs">{{ n.message }}</text>

              <template v-if="linkedIssue(n.issueId)">
                <VySeparator />
                <view class="flex flex-row items-center gap-2">
                  <text class="text-slate-400 text-[11px] font-mono">{{ n.issueId }}</text>
                  <text class="text-slate-400 text-xs">·</text>
                  <text class="text-slate-500 text-xs truncate">{{ linkedIssue(n.issueId)!.project }}</text>
                </view>
                <text class="text-slate-900 text-sm font-medium">{{ linkedIssue(n.issueId)!.title }}</text>
                <view class="flex flex-row items-center gap-2 pt-1">
                  <VyBadge size="sm" variant="soft" :label="linkedIssue(n.issueId)!.status" />
                  <text class="text-slate-500 text-xs ml-auto">{{ linkedIssue(n.issueId)!.assignee }}</text>
                </view>
              </template>
            </view>
          </template>
        </VyPopover>
      </view>
    </view>
  </view>
</template>
