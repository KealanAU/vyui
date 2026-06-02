<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Hybrid CSS + MT-touch slide:

     - Open / close are driven by `@keyframes vyui-sheet-slide-in/out` on
       the `ui-entering` / `ui-leaving` class, applied by the Presence state
       machine. `@animationend` advances Presence to `Entered` / `Left`.
     - Drag is driven by MT touch worklets that paint inline `transform`
       via `setStyleProperty`. On release we either snap back (CSS
       transition) or dismiss (inline transition + `setOpen(false)`).

     The MT refs (touchStart, dragging flag, velocity ring buffer, etc.)
     are only read INSIDE touch worklets, which fire on user input — long
     after the `INIT_MT_REF` ops have been flushed to MT and the refs are
     registered in `_workletRefMap`. This avoids the vue-lynx@0.4.0
     ordering bug that broke the previous MT-rAF approach: that bug only
     bites when `runOnMainThread(worklet)(…)` is dispatched DURING setup,
     before refs are registered. Touch handlers attached via
     `:main-thread-bindtouchstart` go through `SET_WORKLET_EVENT` which
     flushes in the same batch as `INIT_MT_REF`.

     Inline `animation: 'none'` on the dismiss-after-drag path overrides
     Presence's `.ui-leaving` keyframe so the panel slides smoothly from
     its dragged position to off-screen instead of snapping back to
     `translateY(0)` mid-flight. `@transitionend` then advances Presence
     to `Left`. -->
<script lang="ts">
export interface SheetContentImplProps {
  /** Disable dragging. */
  dragDisabled?: boolean
}
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { runOnBackground, useMainThreadRef } from 'vue-lynx'

import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import { useA11y } from '@/shared/composables'
import { injectSheetRootContext, provideSheetDragContext } from './sheetContext'

const props = withDefaults(defineProps<SheetContentImplProps>(), {
  dragDisabled: false,
})

const ctx = injectSheetRootContext()

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

// Height of the panel as a CSS `vh` string, derived from the largest snap
// fraction. e.g. `snapPoints: [0.75]` → `height: 75vh`.
const panelHeight = computed(() => {
  const snaps = ctx.snapPoints.value
  const maxSnap = snaps.length > 0 ? snaps[snaps.length - 1] : 1
  return `${(maxSnap ?? 1) * 100}vh`
})

// Whether the content view should bind touch handlers. `handleOnly` makes
// `SheetHandle` the only drag surface; props.dragDisabled fully disables drag.
const isDragEnabled = computed(() =>
  !props.dragDisabled
  && !ctx.handleOnly.value
  && ctx.enableDragToClose.value,
)

// ---- MT refs for drag state -------------------------------------------
// All read/written only inside `'main thread'` worklets that fire on user
// input. By that time, the `INIT_MT_REF` ops below have been flushed.
const containerRef = useMainThreadRef<any>(null)
const touchStartYRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
const lastTouchYRef = useMainThreadRef<number>(0)
// Ring-buffer for velocity. Each entry is `[y, timestampMs]`. We keep the
// trailing 50ms of touch samples.
const sampleRingRef = useMainThreadRef<Array<[number, number]>>([])
// Panel height in px on MT (for dismiss threshold). Derived from viewport.
const panelHeightPxRef = useMainThreadRef<number>(
  Math.round(ctx.viewportHeight.value * (
    ctx.snapPoints.value.length > 0
      ? ctx.snapPoints.value[ctx.snapPoints.value.length - 1] ?? 1
      : 1
  )),
)

// ---- Touch worklets ---------------------------------------------------

function _setStyle(decl: Record<string, string>) {
  'main thread'
  const el = containerRef as unknown as {
    current?: {
      setStyleProperties?(s: Record<string, string>): void
      setStyleProperty?(k: string, v: string): void
    }
  }
  if (el.current?.setStyleProperties) {
    el.current.setStyleProperties(decl)
  }
  else if (el.current?.setStyleProperty) {
    for (const k in decl) el.current.setStyleProperty(k, decl[k])
  }
}

function _pruneRing(now: number) {
  'main thread'
  const ring = sampleRingRef.current
  while (ring.length > 2 && ring[0][1] < now - 50) ring.shift()
}

function _onTouchStart(e: { detail: { y: number } }) {
  'main thread'
  isDraggingRef.current = true
  const y = e.detail.y
  touchStartYRef.current = y
  lastTouchYRef.current = y
  sampleRingRef.current = [[y, Date.now()]]
  // Kill any in-flight transition AND reset the panel to a known baseline
  // (translateY(0) = fully open). Without resetting the transform here,
  // touching mid-snap-back inherits whatever intermediate transform the
  // CSS transition was computing — the browser can keep painting from
  // that interpolated value, fighting our subsequent `touchmove` writes,
  // which causes drag to "not pick up" the way the user expects.
  // Snapping to 0 immediately gives the drag a clean origin to work from.
  _setStyle({ transition: 'none', transform: 'translateY(0)' })
}

function _onTouchMove(e: { detail: { y: number } }) {
  'main thread'
  if (!isDraggingRef.current) return
  const y = e.detail.y
  lastTouchYRef.current = y
  // Drag only downward (positive delta). Negative deltas (dragging up past
  // the open position) are clamped to 0 — we don't have a snap above open.
  let delta = y - touchStartYRef.current
  if (delta < 0) delta = 0
  _setStyle({ transform: `translateY(${delta}px)` })
  const now = Date.now()
  sampleRingRef.current.push([y, now])
  _pruneRing(now)
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  const startY = touchStartYRef.current
  const endY = lastTouchYRef.current
  const delta = endY - startY

  // Velocity from ring buffer (px/s). Positive = downward.
  const ring = sampleRingRef.current
  let velocity = 0
  if (ring.length >= 2) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    const dt = (last[1] - first[1]) / 1000
    if (dt > 0) velocity = (last[0] - first[0]) / dt
  }

  const panelHpx = panelHeightPxRef.current
  // Dismiss if dragged > 40% of panel height OR flicked down hard.
  const DISMISS_DISTANCE = panelHpx * 0.4
  const FLING_VELOCITY = 600
  const shouldDismiss = delta > DISMISS_DISTANCE
    || (velocity > 0 && velocity > FLING_VELOCITY)

  if (shouldDismiss) {
    // Suppress the `.ui-leaving` keyframe with inline `animation: none` so
    // the slide-off transitions smoothly from the current drag position
    // instead of snapping back to translateY(0) first. The
    // `@transitionend` listener then advances Presence to `Left`.
    _setStyle({
      animation: 'none',
      transition: 'transform 250ms ease-in',
      transform: 'translateY(100%)',
    })
    runOnBackground(_emitClose as any)()
  }
  else {
    // Snap back to open via a quick CSS transition. The .ui-open class
    // statically holds `translateY(0)` once the inline transform matches.
    _setStyle({
      transition: 'transform 280ms ease-out',
      transform: 'translateY(0)',
    })
  }
}

function _onTouchCancel() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false
  _setStyle({
    transition: 'transform 200ms ease-out',
    transform: 'translateY(0)',
  })
}

function _emitClose() {
  ctx.setOpen(false)
}

// SheetHandle uses the same MT touch handlers when handleOnly is true.
provideSheetDragContext({
  handleTouchStartMT: _onTouchStart,
  handleTouchMoveMT: _onTouchMove,
  handleTouchEndMT: _onTouchEnd,
})

const handlers = presence?.animationHandlers

// Modal panel: announce as a dialog and trap a11y focus to the sheet. Container
// role keeps it non-element so the children inside stay reachable.
const a11y = useA11y(() => ({
  role: 'dialog',
  exclusiveFocus: true,
}))
</script>

<template>
  <view
    class="vyui-sheet__content"
    :class="presenceClass"
    v-bind="a11y"
    :data-state="dataState"
    data-vyui-sheet-content
    :main-thread-ref="containerRef"
    :main-thread-bindtouchstart="isDragEnabled ? _onTouchStart : undefined"
    :main-thread-bindtouchmove="isDragEnabled ? _onTouchMove : undefined"
    :main-thread-bindtouchend="isDragEnabled ? _onTouchEnd : undefined"
    :main-thread-bindtouchcancel="isDragEnabled ? _onTouchCancel : undefined"
    :event-through="false"
    :style="{ height: panelHeight }"
    @animationstart="handlers?.handleKFStart"
    @animationend="handlers?.handleKFEnd"
    @animationcancel="handlers?.handleKFCancel"
    @transitionstart="handlers?.handleTransitionStart"
    @transitionend="handlers?.handleTransitionEnd"
    @transitioncancel="handlers?.handleTransitionCancel"
  >
    <slot />
  </view>
</template>

<style>
.vyui-sheet__content {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  z-index: 1001;
  background-color: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Default off-screen — hidden until ui-entering's keyframe slides it in.
     The `both` fill-mode on the keyframes holds the slid position after. */
  transform: translateY(100%);
}

.vyui-sheet__content.ui-open {
  transform: translateY(0);
}

.vyui-sheet__content.ui-entering {
  animation: vyui-sheet-slide-in 280ms ease-out both;
}

.vyui-sheet__content.ui-leaving {
  animation: vyui-sheet-slide-out 280ms ease-in both;
}

@keyframes vyui-sheet-slide-in {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

@keyframes vyui-sheet-slide-out {
  from { transform: translateY(0); }
  to   { transform: translateY(100%); }
}
</style>
