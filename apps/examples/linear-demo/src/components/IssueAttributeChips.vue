<script setup lang="ts">
import type { Ref } from 'vue'
import { VyBadge } from '@vyui/kit'

// Fixed option lists for the demo — each chip rotates through its list on
// tap. Cheaper than a real picker and clearly demos the "stateful badge"
// pattern.
const STATUSES = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done'] as const
const PRIORITIES = ['No priority', 'Low', 'Medium', 'High', 'Urgent'] as const
const ASSIGNEES = ['Unassigned', 'vyui', 'kealan', 'ada', 'grace'] as const
const LABELS = ['No label', 'bug', 'feature', 'chore', 'docs'] as const

// Model-only SFC: vue-lynx@0.4.0 lacks `mergeModels`, which the compiler
// emits whenever `defineModel` shares a component with `defineProps` or
// `defineEmits`. Any extras (e.g. a Save button) must live in the parent.
const status = defineModel<string>('status', { required: true })
const priority = defineModel<string>('priority', { required: true })
const assignee = defineModel<string>('assignee', { required: true })
const label = defineModel<string>('label', { required: true })

function cycle(model: Ref<string>, options: readonly string[]) {
  const idx = options.indexOf(model.value)
  model.value = options[(idx + 1) % options.length]
}
</script>

<template>
  <view class="flex flex-row items-center gap-2">
    <VyBadge
      class="shrink-0"
      size="lg"
      variant="soft"
      color="neutral"
      leading-icon="icon-park-outline:loading-one"
      :label="status"
      @tap="cycle(status, STATUSES)"
    />
    <VyBadge
      class="shrink-0"
      size="lg"
      variant="soft"
      color="neutral"
      leading-icon="icon-park-outline:up-one"
      :label="priority"
      @tap="cycle(priority, PRIORITIES)"
    />
    <VyBadge
      class="shrink-0"
      size="lg"
      variant="soft"
      color="neutral"
      leading-icon="icon-park-outline:user"
      :label="assignee"
      @tap="cycle(assignee, ASSIGNEES)"
    />
    <VyBadge
      class="shrink-0"
      size="lg"
      variant="soft"
      color="neutral"
      leading-icon="icon-park-outline:tag-one"
      :label="label"
      @tap="cycle(label, LABELS)"
    />
  </view>
</template>
