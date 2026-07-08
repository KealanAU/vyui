<script setup lang="ts">
import { ref } from 'vue'
import { ToastProvider } from '@vyui/core'
import {
  VyButton,
  VyIsland,
  VyIslandButton,
  VyIslandGroup,
  VySeparator,
  VyToast,
} from '@vyui/kit'

// Linear-style bottom dock. With the declarative API, the three island state
// axes (`value` for active tab, `mode` for row mode, `open` for the expanded
// panel) are v-model'd from a single set of refs — buttons opt into each axis
// via props (`value=…`, `mode=…`, `expand`, `reset`).
const dockTab = ref<string | number | null>('inbox')
const dockMode = ref<string>('default')
const dockOpen = ref(false)
const floatingDockVisible = ref(true)

// Transient toast — the dock's Inbox / notifications buttons don't navigate in
// this demo, so tapping them surfaces a small "would take you to…" alert that
// auto-dismisses. Mirrors how a real app would route off the dock.
const toastMessage = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
function notify(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 2400)
}
</script>

<template>
  <view class="flex flex-col gap-4 pt-2">
    <!-- Island — the real floating dock is rendered after the closing
         </view> of this card (see below). This card holds the description
         + secondary placement variants (top pair, single icon). -->
    <view class="bg-default border border-default rounded-lg p-4 flex flex-col gap-4">
      <view class="flex flex-col gap-1">
        <text class="text-highlighted text-base font-semibold">Island</text>
        <text class="text-muted text-xs">
          Linear-style pill container — anchored to the viewport edge by
          default. The main dock for this section is floating at the bottom
          of the screen; toggle it below. Side-by-side and single-button
          patterns are inlined here for layout reference.
        </text>
        <text class="text-dimmed text-[11px] pt-1">value: <text class="font-mono">{{ dockTab }}</text> · mode: <text class="font-mono">{{ dockMode }}</text> · open: <text class="font-mono">{{ dockOpen }}</text></text>
      </view>

      <VySeparator />

      <!-- Top pair — two inline islands side-by-side -->
      <view class="flex flex-col items-stretch gap-2">
        <text class="text-muted text-xs">Two top islands side-by-side (left breadcrumb, right actions)</text>
        <view class="flex flex-row items-start justify-between gap-2">
          <VyIsland layer="inline" size="sm">
            <VyIslandButton icon="icon-park-outline:left" @tap="() => {}" />
            <VyIslandButton label="Inbox" @tap="() => {}" />
          </VyIsland>
          <VyIsland layer="inline" size="sm">
            <VyIslandButton icon="icon-park-outline:share" @tap="() => {}" />
            <VyIslandButton icon="icon-park-outline:more" @tap="() => {}" />
          </VyIsland>
        </view>
      </view>

      <VySeparator />

      <!-- Single-button island -->
      <view class="flex flex-col items-center gap-2">
        <text class="text-muted text-xs">Single icon, no labels</text>
        <VyIsland layer="inline" size="lg">
          <VyIslandButton icon="icon-park-outline:message" @tap="() => {}" />
        </VyIsland>
      </view>

      <VySeparator />

      <!-- Show / hide the floating dock anchored at the bottom -->
      <view class="flex flex-row items-center justify-between gap-2">
        <view class="flex flex-col gap-0.5">
          <text class="text-highlighted text-sm font-medium">Floating bottom dock</text>
          <text class="text-muted text-xs">Fixed to the bottom of the viewport. Trailing pill = close.</text>
        </view>
        <VyButton
          :label="floatingDockVisible ? 'Hide' : 'Show'"
          :color="floatingDockVisible ? 'neutral' : 'primary'"
          :variant="floatingDockVisible ? 'subtle' : 'solid'"
          size="sm"
          @tap="floatingDockVisible = !floatingDockVisible"
        />
      </view>
    </view>

    <!-- Transient toast for the dock's Inbox / notifications taps. Pinned to
         the top of the viewport via an inline style (Lynx ignores tailwind
         `fixed`), mirroring the Island float pattern. Wrapped in ToastProvider
         so ToastRoot can inject its context. -->
    <ToastProvider v-if="toastMessage">
      <view :style="{ position: 'fixed', top: '16px', left: '0', right: '0', zIndex: 60, alignItems: 'center' }">
        <VyToast
          :title="toastMessage"
          icon="icon-park-outline:navigation"
          :close="false"
        />
      </view>
    </ToastProvider>

    <!-- Anchored Linear-style dock — rendered at the section root so the
         fixed position is relative to the viewport, not a clipped parent.
         Wrapped in <VyIslandGroup> so a separate close pill sits to the
         right of the main dock. Group owns the bottom-of-viewport
         positioning; member islands stay `layer="inline"`.
         Shares state with the inline preview above. -->
    <VyIslandGroup v-if="floatingDockVisible" position="bottom" size="lg">
      <VyIsland
        v-model:open="dockOpen"
        v-model:mode="dockMode"
        v-model:value="dockTab"
        layer="inline"
        size="lg"
      >
        <VyIslandButton value="inbox" icon="icon-park-outline:inbox-in" @tap="notify('Would take you to Inbox')" />
        <VyIslandButton mode="fullisland" icon="icon-park-outline:search" />
        <VyIslandButton value="bell" icon="icon-park-outline:remind" @tap="notify('Would take you to Notifications')" />
        <VyIslandButton expand icon="icon-park-outline:expand-text-input" />

        <template #fullisland>
          <VyIslandButton reset icon="icon-park-outline:search" label="Search…" />
          <VyIslandButton reset icon="icon-park-outline:close" />
        </template>

        <template #expanded="{ close }">
          <VyIslandButton icon="icon-park-outline:setting" label="Settings" @tap="close" />
          <VyIslandButton icon="icon-park-outline:help" label="Help" @tap="close" />
          <VyIslandButton icon="icon-park-outline:logout" label="Sign out" @tap="floatingDockVisible = false" />
        </template>
      </VyIsland>

      <!-- Trailing companion island. Free-form contents — close here, but
           could be a status pill, a chip count, a mini-player, etc. -->
      <VyIsland layer="inline" size="lg">
        <VyIslandButton icon="icon-park-outline:close" @tap="floatingDockVisible = false" />
      </VyIsland>
    </VyIslandGroup>
  </view>
</template>
