<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Hybrid CSS + MT-touch slide:

     - Open / close are driven by `@keyframes vyui-sheet-slide-in/out` on
       the `ui-entering` / `ui-leaving` class, applied by the Presence state
       machine. `@animationend` advances Presence to `Entered` / `Left`.
     - Drag is driven by MT touch worklets that paint inline `transform`
       via `setStyleProperty`. On release we settle at the nearest snap
       point (inline transition), or dismiss (inline transition +
       `setOpen(false)`). The release decision mirrors `pickRelease` in
       `useSheetBehavior.ts` — see `_onTouchEnd` for the divergences.
     - Multi-snap: positions are px-from-open along the panel's travel
       (`0` = fully open = largest snap; the panel is sized to it). The
       authoritative current position lives in an MT ref (`posRef`) —
       the BG side cannot read it (MainThreadRef reads on BG return the
       init value), so BG-initiated moves hop to MT and decide there.
       Settles sync back to BG `snapIndex`; `snapIndex` writes and
       `setSnap` hop the other way.
     - Drag also paints the backdrop: `touchmove` writes `ctx.progressMTRef`
       and inline `opacity` on `ctx.backdropElRef` so the dim tracks the
       panel 1:1; release restores / fades it with a transition matching
       the panel's. The backdrop unmounts with Presence on close, so the
       inline opacity can't leak into the next open.

     The MT refs (touchStart, dragging flag, velocity ring buffer, etc.)
     are only read INSIDE touch worklets, which fire on user input — long
     after the `INIT_MT_REF` ops have been flushed to MT and the refs are
     registered in `_workletRefMap`. This avoids the vue-lynx@0.4.0
     ordering bug that broke the previous MT-rAF approach: that bug only
     bites when `runOnMainThread(worklet)(…)` is dispatched DURING setup,
     before refs are registered. Touch handlers attached via
     `:main-thread-bindtouchstart` go through `SET_WORKLET_EVENT` which
     flushes in the same batch as `INIT_MT_REF`.

     Config (panel height px, dismiss velocity, settle duration) is
     mirrored into MT refs: initial values ride the constructor's
     `INIT_MT_REF` transfer; later changes hop through watch-triggered
     `runOnMainThread` setter worklets. Plain BG writes to
     `MainThreadRef.current` are silently dropped by vue-lynx@0.4.0 (the
     setter is a dev-warn no-op), and the watch dispatches fire post-mount
     so they don't hit the setup-time registration race above.

     Inline `animation: 'none'` overrides Presence's keyframes wherever
     the panel isn't at the keyframes' assumed position: the dismiss-after-
     drag path (slide off from the dragged position, not translateY(0)),
     and any settle BELOW fully open (so a later non-drag close can't start
     `.ui-leaving` from translateY(0) — `_slideOffFromCurrent` drives those
     closes instead). Settling back at fully open clears the inline
     `animation` so the normal keyframe paths apply again. In all inline
     cases `@transitionend` advances Presence to `Left`. -->
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
import { useA11y, viewportSnapsToPositions } from '@/shared/composables'
import { clamp } from '@/shared/clamp'
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
// With multiple snap points, drag stays enabled even when drag-to-close is
// off — the user can still drag BETWEEN snaps; only the dismiss branch is
// gated (by `enableDragToCloseRef` inside `_onTouchEnd`).
const isDragEnabled = computed(() =>
  !props.dragDisabled
  && !ctx.handleOnly.value
  && (ctx.enableDragToClose.value || ctx.snapPoints.value.length > 1),
)

// ---- MT refs for drag state -------------------------------------------
// All read/written only inside `'main thread'` worklets that fire on user
// input. By that time, the `INIT_MT_REF` ops below have been flushed.
const containerRef = useMainThreadRef<any>(null)
const touchStartYRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
// Ring-buffer for velocity. Each entry is `[y, timestampMs]`. We keep the
// trailing 50ms of touch samples.
const sampleRingRef = useMainThreadRef<Array<[number, number]>>([])

// Root-owned MT refs (created and INIT_MT_REF-registered by SheetRoot).
// Bound to local consts so the worklet transform captures the
// MainThreadRef itself rather than the whole BG context object.
const backdropRef = ctx.backdropElRef
const progressRef = ctx.progressMTRef

// Panel height in px on MT (for the dismiss threshold and backdrop fade
// progress). Recomputes on rotation / late-resolving SystemInfo /
// snapPoint changes; the watch below re-syncs it to MT.
const panelHeightPx = computed(() => {
  const snaps = ctx.snapPoints.value
  const maxSnap = snaps.length > 0 ? snaps[snaps.length - 1] ?? 1 : 1
  return Math.round(ctx.viewportHeight.value * maxSnap)
})
const panelHeightPxRef = useMainThreadRef<number>(panelHeightPx.value)

// Snap positions in px-from-open, ascending (`[0]` = most open = 0, since
// the panel is sized to the largest snap). Resolved by the unit-tested
// helper; mirrored to MT for the release worklet.
const snapPositionsPx = computed(() =>
  viewportSnapsToPositions(ctx.snapPoints.value, ctx.viewportHeight.value, panelHeightPx.value),
)

// Position (px-from-open) that BG's `snapIndex` points at. `ctx.snapIndex`
// is fraction-ordered (0 = smallest fraction = most CLOSED); positions are
// most-open-first, hence the index flip.
const snapTargetPos = computed(() => {
  const positions = snapPositionsPx.value
  const idx = clamp(ctx.snapIndex.value, 0, positions.length - 1)
  return positions[positions.length - 1 - idx] ?? 0
})

// Release physics from SheetRoot's props. `ctx.velocityThreshold` is
// deliberately not mirrored — `pickRelease` (and the worklet mirror of it)
// implements flick-advance via the coast projection instead.
const dismissVelocityRef = useMainThreadRef<number>(ctx.dismissVelocity.value)
const durationMsRef = useMainThreadRef<number>(ctx.duration.value)
const snapPositionsRef = useMainThreadRef<number[]>(snapPositionsPx.value)
const enableDragToCloseRef = useMainThreadRef<boolean>(ctx.enableDragToClose.value)

// Authoritative panel position, px-from-open (0 = fully open). Written by
// the drag/settle worklets the moment a move is COMMITTED (eagerly at
// release, not when the transition finishes). The BG side cannot read it,
// so BG-initiated moves dispatch to MT and decide against it there.
const posRef = useMainThreadRef<number>(0)
// Position the active drag started from (drags can begin at any snap).
const touchStartPosRef = useMainThreadRef<number>(0)

// ---- Config sync BG → MT ----------------------------------------------
// vue-lynx@0.4.0 silently drops BG-thread writes to `MainThreadRef.current`
// (only the constructor's INIT_MT_REF transfers a value BG → MT), so these
// syncs have to hop through `runOnMainThread`. That's safe here: watch
// callbacks fire post-mount, long after the refs are registered — the
// setup-time dispatch race in the header comment doesn't apply.

function _setPanelHeightPx(v: number) {
  'main thread'
  panelHeightPxRef.current = v
}

function _setDismissVelocity(v: number) {
  'main thread'
  dismissVelocityRef.current = v
}

function _setDurationMs(v: number) {
  'main thread'
  durationMsRef.current = v
}

function _setSnapPositions(v: number[]) {
  'main thread'
  snapPositionsRef.current = v
}

function _setEnableDragToClose(v: boolean) {
  'main thread'
  enableDragToCloseRef.current = v
}

watch(panelHeightPx, (v) => { void runOnMainThread(_setPanelHeightPx as any)(v) })
watch(ctx.dismissVelocity, (v) => { void runOnMainThread(_setDismissVelocity as any)(v) })
watch(ctx.duration, (v) => { void runOnMainThread(_setDurationMs as any)(v) })
watch(snapPositionsPx, (v) => { void runOnMainThread(_setSnapPositions as any)(v) })
watch(ctx.enableDragToClose, (v) => { void runOnMainThread(_setEnableDragToClose as any)(v) })

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

// DEVICE-VERIFY: painting a SECOND element (the backdrop) from the
// content's touch worklets hasn't been device-verified — it's the same
// setStyleProperty surface as the panel, but through a ref populated by
// a sibling component (`SheetBackdropImpl`'s `:main-thread-ref`).
function _setBackdropStyle(decl: Record<string, string>) {
  'main thread'
  // The backdrop is optional (sheets can render without one) and unmounts
  // with Presence on close, so `current` may be null — bail quietly.
  const el = backdropRef as unknown as {
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
  sampleRingRef.current = [[y, Date.now()]]
  touchStartPosRef.current = posRef.current
  // Kill any in-flight transition AND re-assert the last COMMITTED position.
  // Without re-asserting the transform here, touching mid-settle inherits
  // whatever intermediate transform the CSS transition was computing — the
  // engine can keep painting from that interpolated value, fighting our
  // subsequent `touchmove` writes, so drag doesn't "pick up". We can't read
  // the interpolated transform on MT, so a mid-settle grab snaps to the
  // settle's target (`posRef` is written eagerly at release) and drags from
  // there — a small jump in the worst case, never a stuck panel.
  _setStyle({ transition: 'none', transform: `translateY(${posRef.current}px)` })
  // The backdrop joins the drag: kill its transition so the per-frame
  // opacity writes in touchmove paint immediately instead of easing.
  _setBackdropStyle({ transition: 'none' })
}

function _onTouchMove(e: { detail: { y: number } }) {
  'main thread'
  if (!isDraggingRef.current) return
  const y = e.detail.y
  // Position = drag origin + finger delta, clamped to the travel range:
  // 0 (fully open — no snap above it) … panel height (fully off-screen).
  const hpx = panelHeightPxRef.current
  let pos = touchStartPosRef.current + (y - touchStartYRef.current)
  if (pos < 0) pos = 0
  if (pos > hpx) pos = hpx
  posRef.current = pos
  _setStyle({ transform: `translateY(${pos}px)` })
  // Drag-synced backdrop fade: 1 = fully open, 0 = dragged the full panel
  // height. Mirrored into the context's progressMTRef for other MT readers.
  let progress = hpx > 0 ? 1 - pos / hpx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  _setBackdropStyle({ opacity: String(progress) })
  const now = Date.now()
  sampleRingRef.current.push([y, now])
  _pruneRing(now)
}

function _onTouchEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  // Velocity from ring buffer (px/s). Positive = downward (toward close).
  const ring = sampleRingRef.current
  let velocity = 0
  if (ring.length >= 2) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    const dt = (last[1] - first[1]) / 1000
    if (dt > 0) velocity = (last[0] - first[0]) / dt
  }

  const pos = posRef.current
  const hpx = panelHeightPxRef.current
  const positions = snapPositionsRef.current
  const durationMs = durationMsRef.current

  // Release decision — MIRRORS `pickRelease` in useSheetBehavior.ts (the
  // unit-tested spec; worklets can't import it — keep the two in sync),
  // with one deliberate divergence: the "≥15px past most-closed with no
  // pull-back" mouse fallback is dropped. That rule exists for desktop
  // Drawer drags (rarely any fling velocity) and would make a touch sheet
  // dismiss on a 16px sag. Coast: 100ms of inertia biases the snap choice
  // toward the fling direction, which is what makes a flick advance one
  // snap without a separate velocity rule.
  const projected = pos + velocity * 0.1
  const mostClosed = positions.length > 0 ? positions[positions.length - 1] : 0
  // Distance past the most-closed snap that dismisses with no velocity:
  // 40% of panel height (the pre-multi-snap rule, generalized to measure
  // from the most-closed snap instead of from open).
  const shouldDismiss = enableDragToCloseRef.current
    && (velocity >= dismissVelocityRef.current
      || projected > mostClosed + hpx * 0.4)

  // Settle timings derive from SheetRoot's `duration` prop: snap settle uses
  // the full duration; dismiss is a slightly quicker 0.9× cut (matches the
  // previous hardcoded 280 / 250ms feel at the default duration).
  if (shouldDismiss) {
    posRef.current = hpx
    const dismissMs = Math.round(durationMs * 0.9)
    // Suppress the `.ui-leaving` keyframe with inline `animation: none` so
    // the slide-off transitions smoothly from the current drag position
    // instead of snapping back to translateY(0) first. The
    // `@transitionend` listener then advances Presence to `Left`.
    _setStyle({
      animation: 'none',
      transition: `transform ${dismissMs}ms ease-in`,
      transform: 'translateY(100%)',
    })
    // Fade the backdrop out alongside the slide-off. Presence unmounts it
    // once the close completes, so the inline opacity can't stick around.
    progressRef.current = 0
    _setBackdropStyle({
      transition: `opacity ${dismissMs}ms ease-in`,
      opacity: '0',
    })
    runOnBackground(_emitClose as any)()
  }
  else {
    // Settle at the snap nearest the coast-projected position.
    let idx = 0
    let best = positions.length > 0 ? Math.abs(projected - positions[0]) : 0
    for (let i = 1; i < positions.length; i++) {
      const d = Math.abs(projected - positions[i])
      if (d < best) {
        best = d
        idx = i
      }
    }
    const target = positions.length > 0 ? positions[idx] : 0
    posRef.current = target
    // Below fully open, inline `animation: none` stays on the panel so a
    // later non-drag close can't start `.ui-leaving` from translateY(0)
    // (`_slideOffFromCurrent` drives those closes). At fully open the
    // inline animation is cleared so the keyframe paths apply again.
    // DEVICE-VERIFY: clearing via empty-string setStyleProperty value.
    _setStyle({
      animation: target === 0 ? '' : 'none',
      transition: `transform ${durationMs}ms ease-out`,
      transform: `translateY(${target}px)`,
    })
    // Move the backdrop dim in step with the settle.
    let progress = hpx > 0 ? 1 - target / hpx : 1
    if (progress < 0) progress = 0
    if (progress > 1) progress = 1
    progressRef.current = progress
    _setBackdropStyle({
      transition: `opacity ${durationMs}ms ease-out`,
      opacity: String(progress),
    })
    runOnBackground(_settle as any)(idx)
  }
}

function _onTouchCancel() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false
  // Cancel returns to the position the drag STARTED from (always a snap),
  // faster than a deliberate release — 0.7× the settle duration (matches
  // the previous hardcoded 200ms at the 280ms default).
  const target = touchStartPosRef.current
  const hpx = panelHeightPxRef.current
  posRef.current = target
  const cancelMs = Math.round(durationMsRef.current * 0.7)
  _setStyle({
    animation: target === 0 ? '' : 'none',
    transition: `transform ${cancelMs}ms ease-out`,
    transform: `translateY(${target}px)`,
  })
  let progress = hpx > 0 ? 1 - target / hpx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  _setBackdropStyle({
    transition: `opacity ${cancelMs}ms ease-out`,
    opacity: String(progress),
  })
}

// Programmatic move (BG `snapIndex` watch / post-enter sync). Skips while
// dragging, and skips the echo that arrives after a drag settle already
// moved the panel (`posRef` is written eagerly at release, so the echoed
// target compares equal).
function _jumpToSnap(target: number) {
  'main thread'
  if (isDraggingRef.current) return
  if (target === posRef.current) return
  posRef.current = target
  const ms = durationMsRef.current
  _setStyle({
    animation: target === 0 ? '' : 'none',
    transition: `transform ${ms}ms ease-out`,
    transform: `translateY(${target}px)`,
  })
  const hpx = panelHeightPxRef.current
  let progress = hpx > 0 ? 1 - target / hpx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  _setBackdropStyle({
    transition: `opacity ${ms}ms ease-out`,
    opacity: String(progress),
  })
}

// Non-drag close (backdrop tap / programmatic `setOpen(false)`) while the
// panel sits below fully open. The `.ui-leaving` keyframe starts at
// translateY(0) and would jump the panel up before sliding off; settles
// below fully open left inline `animation: none` on the panel, so the
// keyframe never starts and this transition drives the close instead. At
// fully open (posRef 0) it bails and the keyframe path runs unchanged; at
// >= panel height a drag-dismiss is already in flight — also bail.
function _slideOffFromCurrent() {
  'main thread'
  if (isDraggingRef.current) return
  const pos = posRef.current
  const hpx = panelHeightPxRef.current
  if (pos === 0 || pos >= hpx) return
  posRef.current = hpx
  const ms = Math.round(durationMsRef.current * 0.9)
  _setStyle({
    animation: 'none',
    transition: `transform ${ms}ms ease-in`,
    transform: 'translateY(100%)',
  })
  progressRef.current = 0
  _setBackdropStyle({
    transition: `opacity ${ms}ms ease-in`,
    opacity: '0',
  })
}

function _emitClose() {
  ctx.setOpen(false)
}

// Drag settle → BG snapIndex. `ascIdx` indexes the most-open-first positions
// array; flip back to the fraction-ordered ctx convention. The write echoes
// through the snapIndex watch below, but `_jumpToSnap` no-ops on it (posRef
// already equals the target).
function _settle(ascIdx: number) {
  const n = ctx.snapPoints.value.length
  const ctxIdx = clamp(n - 1 - ascIdx, 0, n - 1)
  if (ctx.snapIndex.value !== ctxIdx) ctx.snapIndex.value = ctxIdx
}

// BG-initiated moves. While Entering, the slide-in keyframe owns the
// transform (inline writes lose to an active animation), so snapIndex
// changes mid-enter are deferred to the Entered re-sync below. While
// Leaving/Left the panel is on its way out — nothing to move.
watch(snapTargetPos, (pos) => {
  if (presenceState.value !== PresenceState.Entered) return
  void runOnMainThread(_jumpToSnap as any)(pos)
})

// Entered re-sync: the enter keyframe always lands at translateY(0) (fully
// open). If snapIndex points below that — preset before open, or changed
// mid-enter — ease down to it now. Also the v1 "open at an intermediate
// snap" story: slide fully in, then settle down. DEVICE-VERIFY: dispatch
// rides a different channel than the Entered class patch, so the first
// frames of the settle may still be masked by the outgoing keyframe.
watch(presenceState, (s) => {
  if (s === PresenceState.Entered && snapTargetPos.value !== 0) {
    void runOnMainThread(_jumpToSnap as any)(snapTargetPos.value)
  }
})

// Non-drag close hook for `_slideOffFromCurrent`. Dispatch unconditionally —
// only MT knows the real position (`posRef`), and the worklet bails when the
// keyframe path should run (fully open) or a drag-dismiss is in flight.
watch(() => ctx.open.value, (isOpen) => {
  if (!isOpen) void runOnMainThread(_slideOffFromCurrent as any)()
})

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
