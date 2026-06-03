<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { motionConfig } from '@vyui/core'
import {
  VyButton,
  VyDrawer,
  VyDropdownMenu,
  VyIsland,
  VyIslandButton,
  VyModal,
  VySlider,
  type DropdownMenuItem,
} from '@vyui/kit'

// --- Shared motion config -------------------------------------------------
// The whole point of this section: one set of knobs the demos read live, so
// you can dial the feel and watch every surface react. `duration` + `easing`
// drive the Island morph directly (it takes JS timing); the overlay surfaces
// below show the same easing language with their built-in CSS timing.
const duration = ref<number>(280)

interface EasingPreset { label: string, value: string }
const easings: EasingPreset[] = [
  { label: 'Spring', value: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  { label: 'Ease out', value: 'ease-out' },
  { label: 'In-out', value: 'ease-in-out' },
  { label: 'Linear', value: 'linear' },
]
const easing = ref<string>(easings[0].value)

// VySlider works in arrays internally; normalise to a single number.
const durationModel = computed<number>({
  get: () => duration.value,
  set: (v) => { duration.value = Array.isArray(v) ? v[0] : v },
})

// Same knobs drive the portaled overlays (Dialog / Sheet / DropdownMenu) via
// the process-wide `motionConfig` singleton — provide/inject + CSS vars can't
// cross the OverlayRoot portal, but a shared reactive module can. Exit runs a
// touch quicker than enter for a snappier dismiss.
watch([duration, easing], ([d, e]) => {
  motionConfig.enterMs = d
  motionConfig.exitMs = Math.round(d * 0.75)
  motionConfig.easing = e
}, { immediate: true })

// --- Island morph demo ----------------------------------------------------
// Inline island that morphs between a compact pill, a full-width search
// takeover (`mode`), and an expanded action panel (`open`). All three resize
// the container — which is exactly what the morph tweens.
const islandMode = ref<string>('default')
const islandOpen = ref<boolean>(false)

// --- Overlay demos --------------------------------------------------------
const modalOpen = ref<boolean>(false)
const drawerOpen = ref<boolean>(false)
const dropdownOpen = ref<boolean>(false)
const dropdownItems: DropdownMenuItem[][] = [
  [
    { label: 'Profile', icon: 'icon-park-outline:user' },
    { label: 'Settings', icon: 'icon-park-outline:setting' },
  ],
  [
    { label: 'Sign out', icon: 'icon-park-outline:logout', color: 'error' },
  ],
]
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Controls -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-col gap-1">
        <text class="text-slate-900 text-base font-semibold">Timing</text>
        <text class="text-slate-500 text-xs">
          Tune the motion, then trigger the surfaces below. Everything reacts
          live — the Island morph reads the duration/easing as props; the
          overlays read them through the shared motionConfig.
        </text>
      </view>

      <view class="flex flex-col gap-2">
        <view class="flex flex-row items-center justify-between">
          <text class="text-slate-700 text-sm">Duration</text>
          <text class="text-slate-500 text-xs font-mono">{{ duration }}ms</text>
        </view>
        <VySlider v-model="durationModel" :min="0" :max="800" :step="20" />
        <text class="text-slate-400 text-[11px]">0ms snaps (morph off).</text>
      </view>

      <view class="flex flex-col gap-2">
        <text class="text-slate-700 text-sm">Easing</text>
        <view class="flex flex-row flex-wrap gap-2">
          <VyButton
            v-for="e in easings"
            :key="e.value"
            size="sm"
            :variant="easing === e.value ? 'solid' : 'subtle'"
            :color="easing === e.value ? 'primary' : 'neutral'"
            :label="e.label"
            @tap="easing = e.value"
          />
        </view>
      </view>
    </view>

    <!-- Island morph -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <view class="flex flex-col gap-1">
        <text class="text-slate-900 text-base font-semibold">Island morph</text>
        <text class="text-slate-500 text-xs">
          One shape smoothly becomes another (Dynamic-Island style). Tap search
          to take over the row; tap + to sprout the panel.
        </text>
        <text class="text-slate-400 text-[11px] pt-1">mode: <text class="font-mono">{{ islandMode }}</text> · open: <text class="font-mono">{{ islandOpen }}</text></text>
      </view>

      <view class="flex flex-row w-full">
        <VyIsland
          v-model:mode="islandMode"
          v-model:open="islandOpen"
          layer="inline"
          size="lg"
          expand-style="attached"
          :morph-ms="duration"
          :morph-easing="easing"
          :style="islandMode === 'search' ? { flexGrow: 1 } : undefined"
        >
          <VyIslandButton mode="search" icon="icon-park-outline:search" />
          <VyIslandButton value="home" icon="icon-park-outline:home" />
          <VyIslandButton :expand="true" icon="icon-park-outline:add" />

          <template #search>
            <VyIslandButton
              reset
              icon="icon-park-outline:search"
              label="Search…"
              :style="{ flexGrow: 1, justifyContent: 'flex-start' }"
            />
            <VyIslandButton reset icon="icon-park-outline:close" />
          </template>

          <template #expanded>
            <VyIslandButton :expand="true" icon="icon-park-outline:add" label="New issue" class="w-full justify-start" />
            <VyIslandButton :expand="true" icon="icon-park-outline:filter" label="Filter" class="w-full justify-start" />
            <VyIslandButton :expand="true" icon="icon-park-outline:setting" label="Settings" class="w-full justify-start" />
          </template>
        </VyIsland>
      </view>
    </view>

    <!-- DropdownMenu -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
      <text class="text-slate-900 text-base font-semibold">DropdownMenu</text>
      <text class="text-slate-500 text-xs">Scale + fade on open; no linger on close.</text>
      <VyDropdownMenu v-model:open="dropdownOpen" :items="dropdownItems">
        <VyButton color="neutral" variant="soft" label="Menu" trailing-icon="icon-park-outline:down" />
      </VyDropdownMenu>
    </view>

    <!-- Modal + Drawer -->
    <view class="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
      <text class="text-slate-900 text-base font-semibold">Dialog &amp; Sheet</text>
      <text class="text-slate-500 text-xs">Overlay surfaces — slide-up sheet re-times live; dialog uses its built-in timing.</text>
      <view class="flex flex-row gap-2">
        <VyModal v-model:open="modalOpen" title="Dialog" description="Zoom-fade in, fade out.">
          <VyButton color="neutral" variant="subtle" label="Open dialog" />
          <template #content>
            <view class="p-4">
              <text class="text-slate-600 text-sm">Hello from the dialog.</text>
            </view>
          </template>
        </VyModal>
        <VyDrawer v-model:open="drawerOpen" title="Sheet" description="Slide-up bottom sheet.">
          <VyButton color="neutral" variant="subtle" label="Open sheet" />
        </VyDrawer>
      </view>
    </view>
  </view>
</template>
