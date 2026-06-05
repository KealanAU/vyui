<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Renders inside `<Presence>` so `inject(PresenceContextKey)` resolves to
     the parent's payload. Binds `@animationstart` / `@animationend` etc. on
     the root `<view>` — Lynx fires these as plain BG-thread events on
     keyframe animations, so they advance Presence into Entered / Left. -->
<script setup lang="ts">
import { computed, inject } from 'vue'

import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import { injectSheetRootContext } from './sheetContext'

const emits = defineEmits<{
  tap: []
}>()

const ctx = injectSheetRootContext()

// Same MT element handle SheetContent's drag worklets paint opacity into;
// the keyframe-based fade below targets the same `<view>` via class.
const overlayRef = ctx.backdropElRef

const presence = inject(PresenceContextKey, null)

const presenceState = computed<PresenceState>(() =>
  presence?.controllers.state.value ?? PresenceState.Entered,
)

const presenceClass = computed(() =>
  presenceClassVariants({
    state: presenceState.value,
    enableDelay: false,
    transition: true,
  }),
)

const dataState = computed(() =>
  presenceState.value === PresenceState.Leaving
  || presenceState.value === PresenceState.Left
    ? 'closed'
    : 'open',
)

const handlers = presence?.animationHandlers
</script>

<template>
  <view
    class="vyui-sheet__backdrop"
    :class="presenceClass"
    :data-state="dataState"
    data-vyui-sheet-backdrop
    :main-thread-ref="overlayRef"
    :event-through="false"
    :style="{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      zIndex: '1000',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    }"
    @tap="emits('tap')"
    @animationstart="handlers?.handleKFStart"
    @animationend="handlers?.handleKFEnd"
    @animationcancel="handlers?.handleKFCancel"
    @transitionstart="handlers?.handleTransitionStart"
    @transitionend="handlers?.handleTransitionEnd"
    @transitioncancel="handlers?.handleTransitionCancel"
  />
</template>

<style>
/* Hidden at rest AND through Presence's mount→enter gap (the element mounts
   ~8 frames before the state flips to Entering). Without this the dim paints
   at full opacity for those frames, then snaps to 0 and fades in — the
   first-open flash. `ui-open` is the resting-visible state; the keyframes
   bridge the transitions. */
.vyui-sheet__backdrop {
  opacity: 0;
}

.vyui-sheet__backdrop.ui-open {
  opacity: 1;
}

.vyui-sheet__backdrop.ui-entering {
  animation: vyui-fade-in 280ms ease-out both;
}

.vyui-sheet__backdrop.ui-leaving {
  animation: vyui-fade-out 280ms ease-in both;
}
</style>
