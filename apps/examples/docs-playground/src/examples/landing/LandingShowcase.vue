<script setup lang="ts">
import type { GlobalEventEmitter } from '@lynx-js/types'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ToastProvider, ToastViewport } from '@vyui/core'
import { VyAvatar, VyAvatarGroup, VyBadge, VyButton, VyCard, VyProgress, VySlider, VySwitch, VyToast, VyTray, VyTrayView } from '@vyui/kit'
import { globalEmitter } from '../../globalEmitter'

const COLORS = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const theme = ref<(typeof COLORS)[number]>('primary')
let emitter: GlobalEventEmitter | undefined

function onColor(...args: unknown[]) {
  const match = COLORS.find(name => name === args[0])
  if (match) theme.value = match
}

const SPEND = 820

const cap = ref(2000)
const pause = ref(false)
const tray = ref(false)

const MEMBERS = [
  { src: '/avatars/12.jpg', text: 'AK' },
  { src: '/avatars/32.jpg', text: 'JR' },
  { src: '/avatars/47.jpg', text: 'MP' },
  { src: '/avatars/60.jpg', text: 'DL' },
  { src: '/avatars/68.jpg', text: 'SC' },
]

const percent = computed(() => Math.min(100, Math.round((SPEND / cap.value) * 100)))

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
  [4200, () => tweenCap(950)],
  [4400, () => { pause.value = true }],
  [4200, () => pushToast()],
  [2200, () => pushToast()],
  [7200, () => { tray.value = true }],
  [9600, () => { tray.value = false }],
  [4400, () => {
    cap.value = 2000
    pause.value = false
  }],
]

let step: ReturnType<typeof setTimeout> | undefined
let tween: ReturnType<typeof setInterval> | undefined

// Walked, not assigned: the slider has no transition, so the thumb would teleport.
function tweenCap(to: number) {
  if (tween) clearInterval(tween)
  tween = setInterval(() => {
    const gap = to - cap.value
    if (gap === 0) {
      clearInterval(tween)
      return
    }
    cap.value += Math.sign(gap) * Math.min(25, Math.abs(gap))
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
          <text class="text-sm text-muted">Billing</text>
        </view>
        <VyBadge label="Pro" :color="theme" variant="soft" size="sm" />
      </view>

      <view class="flex flex-col gap-4 p-4 rounded-2xl bg-elevated">
        <view class="flex flex-col gap-2">
          <view class="flex flex-row items-center">
            <text class="flex-1 text-sm text-muted">This month</text>
            <text class="text-sm font-medium text-highlighted">${{ SPEND }} of ${{ cap }}</text>
          </view>
          <VyProgress :model-value="percent" :color="theme" size="sm" />
        </view>

        <view class="flex flex-col gap-2">
          <view class="flex flex-row items-center">
            <text class="flex-1 text-sm text-muted">Monthly cap</text>
            <text class="text-sm font-medium text-highlighted">${{ cap }}</text>
          </view>
          <VySlider v-model="cap" :color="theme" :min="0" :max="2000" :step="25" @update:model-value="takeOver" />
        </view>

        <VySwitch v-model="pause" :color="theme" label="Pause services at cap" @update:model-value="takeOver" />
      </view>

      <VyCard variant="outline">
        <view class="flex flex-row items-center gap-3">
          <VyAvatarGroup size="md" :max="2" :color="theme">
            <VyAvatar v-for="member in MEMBERS" :key="member.src" :src="member.src" :text="member.text" />
          </VyAvatarGroup>
          <view class="flex flex-col flex-1">
            <text class="text-sm font-medium text-highlighted">Gets the alert</text>
            <text class="text-xs text-muted">{{ MEMBERS.length }} people</text>
          </view>
        </view>
      </VyCard>

      <view class="flex flex-row gap-2">
        <view class="flex-1">
          <VyButton
            label="Send a test"
            icon="i-lucide-bell"
            :color="theme"
            block
            @tap="takeOver(); pushToast()"
          />
        </view>
        <view class="flex-1">
          <VyButton
            label="Breakdown"
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
        :title="`Spend at ${percent}% of cap`"
        :description="`$${SPEND} of $${cap} used this month.`"
        icon="i-lucide-credit-card"
        :color="theme"
        progress
        @update:open="open => !open && dismissToast(id)"
      />
    </ToastViewport>

    <VyTray v-model:open="tray" default-view="details">
      <template #default>
        <VyTrayView id="details">
          <view class="flex flex-col gap-2">
            <text class="text-base font-semibold text-highlighted">${{ SPEND }} this month</text>
            <text class="text-sm text-muted">Compute $510 · Storage $180 · Bandwidth $130. Pro plan, billed 1 Aug.</text>
          </view>
        </VyTrayView>
      </template>

      <template #footer="{ close }">
        <VyButton color="neutral" variant="soft" label="Close" block @tap="close()" />
      </template>
    </VyTray>
  </ToastProvider>
</template>
