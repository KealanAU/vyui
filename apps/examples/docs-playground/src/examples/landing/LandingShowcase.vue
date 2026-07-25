<script setup lang="ts">
import type { GlobalEventEmitter } from '@lynx-js/types'
import { onMounted, onUnmounted, ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyAvatar, VyAvatarGroup, VyBadge, VyButton, VyCard, VySlider, VySwitch, VyToast, VyToggleGroup, VyTray, VyTrayView } from '@vyui/kit'

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const theme = ref<(typeof COLORS)[number]>('primary')
let emitter: GlobalEventEmitter | undefined

function onColor(...args: unknown[]) {
  const match = COLORS.find(name => name === args[0])
  if (match) theme.value = match
}

// `lynx.getJSModule` is a no-op on web-core's background lynx, so fall back to
// the emitter the web runtime actually emits on — the native app's own.
function globalEmitter(): GlobalEventEmitter | undefined {
  if (typeof lynx === 'undefined') return undefined
  const nativeApp = (lynx as { getNativeApp?: () => { GlobalEventEmitter?: GlobalEventEmitter } }).getNativeApp?.()
  return lynx.getJSModule('GlobalEventEmitter') ?? nativeApp?.GlobalEventEmitter
}

const threshold = ref(35)
const notify = ref(false)
const scope = ref('All')
const tray = ref(false)

// Disabled rather than `v-if`: vue-lynx realizes a false v-if as a zero-size
// anchor node that the card's `gap-4` still counts, leaving a phantom gap.
const SCOPES = ['All', 'Mentions', 'None']

const MEMBERS = [
  { src: '/avatars/12.jpg', text: 'AK' },
  { src: '/avatars/32.jpg', text: 'JR' },
  { src: '/avatars/47.jpg', text: 'MP' },
  { src: '/avatars/60.jpg', text: 'DL' },
  { src: '/avatars/68.jpg', text: 'SC' },
]

const toasts = ref<number[]>([])
let nextToast = 0

function pushToast() {
  toasts.value = [...toasts.value, ++nextToast]
}

function dismissToast(id: number) {
  toasts.value = toasts.value.filter(toast => toast !== id)
}

// Autoplay timeline — [wait ms, then run], looping.
const SCENE: [number, () => void][] = [
  [4200, () => tweenThreshold(82)],
  [4400, () => { notify.value = true }],
  [2400, () => { scope.value = 'Mentions' }],
  [2800, () => pushToast()],
  [2200, () => pushToast()],
  [7200, () => { tray.value = true }],
  [9600, () => { tray.value = false }],
  [4400, () => {
    threshold.value = 35
    notify.value = false
    scope.value = 'All'
  }],
]

let step: ReturnType<typeof setTimeout> | undefined
let tween: ReturnType<typeof setInterval> | undefined

// Walked, not assigned: the slider has no transition, so the thumb would teleport.
function tweenThreshold(to: number) {
  if (tween) clearInterval(tween)
  tween = setInterval(() => {
    const gap = to - threshold.value
    if (gap === 0) {
      clearInterval(tween)
      return
    }
    threshold.value += Math.sign(gap) * Math.min(2, Math.abs(gap))
  }, 44)
}

// Only user-driven emits land here — the scene mutates refs directly, which
// emits nothing, so autoplay can't cancel itself.
function takeOver() {
  if (step) clearTimeout(step)
  if (tween) clearInterval(tween)
  step = undefined
  tween = undefined
}

function play(index = 0) {
  const [wait, run] = SCENE[index % SCENE.length]!
  step = setTimeout(() => {
    run()
    play(index + 1)
  }, wait)
}

onMounted(() => {
  play()
  emitter = globalEmitter()
  emitter?.addListener('vyui:color', onColor)
})

onUnmounted(() => {
  if (step) clearTimeout(step)
  if (tween) clearInterval(tween)
  emitter?.removeListener('vyui:color', onColor)
})
</script>

<template>
  <ToastProvider :duration="4000">
    <view class="w-full flex flex-col gap-5">
      <view class="flex flex-row items-center gap-3">
        <VyAvatar text="VY" :color="theme" size="lg" />
        <view class="flex flex-col flex-1">
          <text class="text-base font-semibold text-highlighted">Vy UI</text>
          <text class="text-sm text-muted">Workspace settings</text>
        </view>
        <VyBadge label="Pro" :color="theme" variant="soft" size="sm" />
      </view>

      <VyCard variant="outline">
        <view class="flex flex-row items-center gap-3">
          <VyAvatarGroup size="sm" :max="3" :color="theme">
            <VyAvatar v-for="member in MEMBERS" :key="member.src" :src="member.src" :text="member.text" />
          </VyAvatarGroup>
          <view class="flex flex-col flex-1">
            <text class="text-sm font-medium text-highlighted">Members</text>
            <text class="text-xs text-muted">5 people · 2 invites pending</text>
          </view>
        </view>
      </VyCard>

      <view class="flex flex-col gap-4 p-4 rounded-2xl bg-elevated">
        <view class="flex flex-col gap-2">
          <view class="flex flex-row items-center">
            <text class="flex-1 text-sm text-muted">Storage alert</text>
            <text class="text-sm font-medium text-highlighted">{{ threshold }}%</text>
          </view>
          <VySlider v-model="threshold" :color="theme" :min="0" :max="100" @update:model-value="takeOver" />
        </view>

        <VySwitch v-model="notify" :color="theme" label="Push notifications" @update:model-value="takeOver" />

        <VyToggleGroup
          v-model="scope"
          :items="SCOPES"
          :color="theme"
          :disabled="!notify"
          variant="subtle"
          size="sm"
          @update:model-value="takeOver"
        />
      </view>

      <view class="flex flex-row gap-2">
        <view class="flex-1">
          <VyButton
            label="Test alert"
            icon="i-lucide-bell"
            :color="theme"
            block
            @tap="takeOver(); pushToast()"
          />
        </view>
        <view class="flex-1">
          <VyButton
            label="Manage plan"
            color="neutral"
            variant="outline"
            block
            @tap="takeOver(); tray = true"
          />
        </view>
      </view>
    </view>

    <ToastViewport position="top" :style="{ top: '16px', zIndex: 60 }">
      <VyToast
        v-for="id in toasts"
        :key="id"
        stacked
        stack-from="top"
        :title="`Storage at ${threshold}%`"
        description="Test alert sent to this device."
        icon="i-lucide-hard-drive"
        :color="theme"
        progress
        @update:open="open => !open && dismissToast(id)"
      />
    </ToastViewport>

    <VyTray v-model:open="tray" default-view="details">
      <template #default>
        <VyTrayView id="details">
          <view class="flex flex-col gap-2">
            <text class="text-base font-semibold text-highlighted">Pro plan</text>
            <text class="text-sm text-muted">5 of 10 seats used. Invites expire after 7 days.</text>
          </view>
        </VyTrayView>
      </template>

      <template #footer="{ close }">
        <VyButton color="neutral" variant="soft" label="Close" block @tap="close()" />
      </template>
    </VyTray>
  </ToastProvider>
</template>
