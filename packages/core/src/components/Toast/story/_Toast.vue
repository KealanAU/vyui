<script setup lang="ts">
import { ref } from 'vue'
import {
  ToastAction,
  ToastClose,
  ToastProvider,
  ToastRoot,
  ToastViewport,
} from '..'

const props = defineProps<{
  duration?: number
  providerDuration?: number
  expandByDefault?: boolean
  defaultOpen?: boolean
  type?: 'foreground' | 'background'
}>()

const actionCount = ref(0)
const lastOpenEvent = ref<boolean | null>(null)
function onAction() {
  actionCount.value++
}
function onUpdateOpen(v: boolean) {
  lastOpenEvent.value = v
}

// Pass per-test toast props as a single v-bind object. Vue treats each
// individual `:prop="..."` binding as an explicit prop set (including
// `undefined`), and explicitly setting `open` / `defaultOpen` to `undefined`
// breaks ToastRoot's `useVModel(... passive: open === undefined)` passive-mode
// detection — even though the value is the same as the default. Using one
// `v-bind` with the resolved object lets us omit absent keys entirely so the
// `withDefaults` defaults inside ToastRoot apply.
const toastBindings = (() => {
  const obj: Record<string, unknown> = {}
  if (props.duration !== undefined) obj.duration = props.duration
  if (props.type !== undefined) obj.type = props.type
  if (props.defaultOpen !== undefined) obj.defaultOpen = props.defaultOpen
  return obj
})()
</script>

<template>
  <ToastProvider :duration="props.providerDuration" :expand-by-default="props.expandByDefault">
    <template #default="{ expanded, count }">
      <ToastRoot
        v-slot="{ open, index, count: localCount, isFront, heightBefore, expand, collapse, toggleExpanded }"
        data-testid="toast"
        @update:open="onUpdateOpen"
      >
        <ToastAction alt-text="Undo" data-testid="action" @action="onAction">
          <text>Undo</text>
        </ToastAction>
        <ToastClose data-testid="close">
          <text>x</text>
        </ToastClose>
        <view data-testid="expand-btn" @tap="expand">
          <text>expand</text>
        </view>
        <view data-testid="collapse-btn" @tap="collapse">
          <text>collapse</text>
        </view>
        <view data-testid="toggle-btn" @tap="toggleExpanded">
          <text>toggle</text>
        </view>
        <text data-testid="local-index">{{ index }}</text>
        <text data-testid="local-count">{{ localCount }}</text>
        <text data-testid="is-front">{{ String(isFront) }}</text>
        <text data-testid="height-before">{{ heightBefore }}</text>
        <text data-testid="open">{{ String(open) }}</text>
      </ToastRoot>
      <text data-testid="expanded">{{ String(expanded) }}</text>
      <text data-testid="count">{{ count }}</text>
      <text data-testid="action-count">{{ actionCount }}</text>
      <text data-testid="last-open-event">{{ lastOpenEvent === null ? '' : String(lastOpenEvent) }}</text>
      <ToastViewport data-testid="viewport" />
    </template>
  </ToastProvider>
</template>
