<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { OverlayRoot } from '@vyui/core'
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
</script>

<template>
  <view class="relative flex items-center justify-center w-full min-h-screen px-4 py-6 bg-transparent">
    <!-- Paints overlay-portal components (Toast, Modal, Popover, ActionSheet);
         their ToastViewport / *Content register into the overlayStore and only
         render through an OverlayRoot mounted at the app root. -->
    <OverlayRoot />

    <component :is="current" v-if="current" />
    <text v-else class="text-sm text-red-500">Unknown example: {{ requested }}</text>
  </view>
</template>
