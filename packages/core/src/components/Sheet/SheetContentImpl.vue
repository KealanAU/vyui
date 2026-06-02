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
import { computed, inject, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

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

// Resting offset (px, downward) the panel sits at for each snap index. The
// panel is always rendered at its largest-snap height; smaller snaps are
// reached by translating it down. Index-aligned with `ctx.snapPoints`
// (ascending fraction), so the largest snap is offset 0.
const snapOffsetsPx = computed(() => {
  const snaps = ctx.snapPoints.value
  const maxSnap = snaps.length > 0 ? snaps[snaps.length - 1] ?? 1 : 1
  const vh = ctx.viewportHeight.value
  return snaps.map(s => Math.max(0, Math.round((maxSnap - s) * vh)))
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
// Whether the finger moved past the drag threshold this gesture. A tap (or
// sub-threshold jitter) leaves this false so touchend does NOT change snap —
// otherwise a tiny fast movement yields a huge spurious velocity that would
// trip the fling / dismiss logic and "snap" on a plain click.
const hasDraggedRef = useMainThreadRef<boolean>(false)
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
// Snap rest offsets (px) and the offset the panel currently rests at, so a
// drag continues from the active snap instead of from fully-open. Plus the
// tunables the settle worklet reads (mirrored from `ctx` for MT access).
const snapOffsetsRef = useMainThreadRef<number[]>(snapOffsetsPx.value)
const currentSnapOffsetRef = useMainThreadRef<number>(
  snapOffsetsPx.value[ctx.snapIndex.value] ?? 0,
)
const velocityThresholdRef = useMainThreadRef<number>(ctx.velocityThreshold.value)
const dismissVelocityRef = useMainThreadRef<number>(ctx.dismissVelocity.value)
const settleDurationRef = useMainThreadRef<number>(ctx.duration.value)
const enableDragToCloseRef = useMainThreadRef<boolean>(ctx.enableDragToClose.value)

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
  hasDraggedRef.current = false
  const y = e.detail.y
  touchStartYRef.current = y
  lastTouchYRef.current = y
  sampleRingRef.current = [[y, Date.now()]]
  // Kill any in-flight transition and pin the panel to its current resting
  // offset (the active snap). Without freezing the transform here, touching
  // mid-settle inherits whatever interpolated value the CSS transition was
  // painting and fights the subsequent `touchmove` writes, so the drag
  // "doesn't pick up". Pinning to the rest offset gives a clean origin while
  // keeping the panel visually where it was.
  _setStyle({ transition: 'none', transform: `translateY(${currentSnapOffsetRef.current}px)` })
}

function _onTouchMove(e: { detail: { y: number } }) {
  'main thread'
  if (!isDraggingRef.current) return
  const y = e.detail.y
  lastTouchYRef.current = y
  // Position = active snap offset + drag delta. Dragging up (negative delta)
  // moves toward the largest snap; clamp at 0 since there's nothing above it.
  const delta = y - touchStartYRef.current
  // Engage drag once past a small threshold so taps / micro-jitter are ignored.
  if (!hasDraggedRef.current && (delta > 6 || delta < -6)) hasDraggedRef.current = true
  let pos = currentSnapOffsetRef.current + delta
  if (pos < 0) pos = 0
  _setStyle({ transform: `translateY(${pos}px)` })
  const now = Date.now()
  sampleRingRef.current.push([y, now])
  _pruneRing(now)
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  // A tap / sub-threshold touch never became a drag — leave the snap exactly
  // as it was (settle any micro-offset back to the current rest position).
  if (!hasDraggedRef.current) {
    _setStyle({
      transition: 'transform 200ms ease-out',
      transform: `translateY(${currentSnapOffsetRef.current}px)`,
    })
    return
  }

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

  const offsets = snapOffsetsRef.current
  const lastIdx = offsets.length - 1
  // Smallest snap = largest downward offset. snapPoints are sorted ascending,
  // so index 0 is the lowest fraction (the furthest-down rest position).
  const smallestSnapOffset = offsets.length > 0 ? offsets[0] : 0

  // Current rest position, then a momentum projection so a flick carries
  // toward the next snap in the direction of travel.
  let pos = currentSnapOffsetRef.current + delta
  if (pos < 0) pos = 0
  const projected = pos + velocity * 0.12

  const panelHpx = panelHeightPxRef.current
  // Dismiss when the projected rest sits well below the lowest snap, or on a
  // hard downward fling at/below it. Only when drag-to-close is enabled.
  const shouldDismiss = enableDragToCloseRef.current && (
    projected > smallestSnapOffset + panelHpx * 0.18
    || (velocity > dismissVelocityRef.current && pos > smallestSnapOffset - 24)
  )

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
    return
  }

  // Settle to the snap nearest the projected position.
  let bestIdx = lastIdx
  let bestDist = -1
  for (let i = 0; i < offsets.length; i++) {
    const d = projected - offsets[i]
    const abs = d < 0 ? -d : d
    if (bestDist < 0 || abs < bestDist) {
      bestDist = abs
      bestIdx = i
    }
  }
  // A deliberate fling beyond the snap-velocity threshold steps one snap
  // further in the direction of travel (down = smaller fraction = +offset).
  if (velocity > velocityThresholdRef.current && bestIdx > 0) bestIdx -= 1
  else if (velocity < -velocityThresholdRef.current && bestIdx < lastIdx) bestIdx += 1

  const target = offsets[bestIdx]
  currentSnapOffsetRef.current = target
  _setStyle({
    transition: `transform ${settleDurationRef.current}ms ease-out`,
    transform: `translateY(${target}px)`,
  })
  runOnBackground(_emitSnap as any)(bestIdx)
}

function _onTouchCancel() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false
  _setStyle({
    transition: 'transform 200ms ease-out',
    transform: `translateY(${currentSnapOffsetRef.current}px)`,
  })
}

// Animate the panel to a given rest offset — used for the initial open snap
// and for controlled `snapIndex` / programmatic `setSnap` changes.
function _settleToOffset(offset: number) {
  'main thread'
  currentSnapOffsetRef.current = offset
  _setStyle({
    transition: `transform ${settleDurationRef.current}ms ease-out`,
    transform: `translateY(${offset}px)`,
  })
}

// Slide off-screen from wherever the panel currently rests (used on
// programmatic close so it doesn't jump to fully-open first).
function _closeFromCurrent() {
  'main thread'
  _setStyle({
    animation: 'none',
    transition: 'transform 250ms ease-in',
    transform: 'translateY(100%)',
  })
}

function _emitClose() {
  ctx.setOpen(false)
}

function _emitSnap(idx: number) {
  ctx.setSnap(idx)
}

// SheetHandle uses the same MT touch handlers when handleOnly is true.
provideSheetDragContext({
  handleTouchStartMT: _onTouchStart,
  handleTouchMoveMT: _onTouchMove,
  handleTouchEndMT: _onTouchEnd,
})

// Once the entrance keyframe lands (at fully-open), ease down to the active
// snap if it isn't the largest one — so a sheet opened at an intermediate
// `defaultSnapIndex` / controlled `snapIndex` rests there.
watch(presenceState, (s) => {
  if (s !== PresenceState.Entered) return
  const off = snapOffsetsPx.value[ctx.snapIndex.value] ?? 0
  if (off > 0) runOnMainThread(_settleToOffset as any)(off)
})

// Follow controlled `snapIndex` / `setSnap` changes while open. The drag
// settle re-emits the index it just moved to, so this re-applies the same
// offset (a no-op) in that case.
watch(() => ctx.snapIndex.value, (idx) => {
  if (!ctx.open.value || presenceState.value !== PresenceState.Entered) return
  runOnMainThread(_settleToOffset as any)(snapOffsetsPx.value[idx] ?? 0)
})

// Smooth programmatic close (e.g. backdrop tap) from any resting offset.
watch(() => ctx.open.value, (isOpen, was) => {
  if (was && !isOpen) runOnMainThread(_closeFromCurrent as any)()
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
