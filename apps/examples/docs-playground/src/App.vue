<script setup lang="ts">
import type { GlobalEventEmitter } from '@lynx-js/types'
import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { OverlayRoot } from '@vyui/core'
import { useColorMode } from '@vyui/kit'
import { globalEmitter } from './globalEmitter'
import { examples } from './examples'

// The docs host selects which example to mount via `global-props`. On the
// background thread that lands on `lynx.__globalProps`; read it once at setup.
// Falls back to the first registered example when opened standalone.
const requested = shallowRef<string>(
  (typeof lynx !== 'undefined' && lynx.__globalProps?.example)
  || Object.keys(examples)[0]
  || '',
)

const current = computed(() => examples[requested.value])

// The runtime is a Web Worker with no `matchMedia`, so `'system'` always
// resolves light in here and the card would keep light-mode text on the host's
// dark backdrop. The docs page pushes its own resolved mode over the same
// channel the accent swatches use.
const { mode, isDark, setMode } = useColorMode()
let emitter: GlobalEventEmitter | undefined

function onMode(...args: unknown[]) {
  if (args[0] === 'light' || args[0] === 'dark') setMode(args[0])
}

onMounted(() => {
  emitter = globalEmitter()
  emitter?.addListener('vyui:mode', onMode)
})

onUnmounted(() => {
  emitter?.removeListener('vyui:mode', onMode)
})
</script>

<template>
  <!-- `useColorMode` app-root contract: `:key` remounts because the `dark` class
       alone only re-skins fresh mounts. Stays `bg-transparent` — the host's
       `.device-screen` paints the phone background and flips with the same toggle. -->
  <view
    :key="mode"
    :class="{ dark: isDark }"
    class="relative flex items-center justify-center w-full min-h-screen px-4 py-6 bg-transparent"
  >
    <!-- Paints overlay-portal components (Toast, Modal, Popover, Drawer);
         their ToastViewport / *Content register into the overlayStore and only
         render through an OverlayRoot mounted at the app root. -->
    <OverlayRoot />

    <component :is="current" v-if="current" />
    <text v-else class="text-sm text-red-500">Unknown example: {{ requested }}</text>
  </view>
</template>
