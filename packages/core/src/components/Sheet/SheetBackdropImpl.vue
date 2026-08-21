<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Renders inside `<Presence>` but is painted by `OverlayRoot`, so
     `inject(PresenceContextKey)` resolves through the provides `OverlayPortal`
     captured at registration, not through tree ancestry. The `@animation*`
     bindings on the root `<view>` are what advance Presence into Entered /
     Left. -->
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

// Same MT element handle SheetContent's drag worklets paint inline `opacity`
// into; the keyframe fade below covers open / close on the same `<view>` via
// class. Presence unmounts this view on close, so inline drag styles can't leak
// into the next open.
const overlayRef = ctx.backdropElRef

const presence = inject(PresenceContextKey, null)

const presenceState = computed<PresenceState>(() =>
  presence?.controllers.state.value ?? PresenceState.Entered,
)

// Same reason as the panel (see SheetContentImpl): after a drag-dismiss the
// scrim's inline `opacity` is already fading out, and `vyui-fade-out` — which
// keeps an explicit `from { opacity: 1 }` — would yank the dim back to full.
// Dropping `ui-leaving` leaves the base `opacity: 0` rule under the inline fade.
const presenceClass = computed(() =>
  presenceClassVariants({
    state: presenceState.value,
    enableDelay: false,
    transition: !ctx.dragClosing.value,
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
      // No `backgroundColor` — headless. Inline here, no class could override
      // it, so a consumer's dim class was silently dead. Inline longhand
      // overrides the 280ms keyframe shorthands so the fade tracks `duration`.
      animationDuration: `${ctx.duration.value}ms`,
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
/* Hidden at rest AND through Presence's mount→enter gap (the element mounts ~8
   frames before the state flips to Entering) — without this the dim paints at
   full opacity for those frames, then snaps to 0 and fades in. */
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
