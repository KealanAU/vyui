<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->
<script lang="ts">
export interface SheetContentImplProps {
  /** Disable dragging. */
  dragDisabled?: boolean
  /**
   * Hug content instead of sizing the panel to `snapPoints × viewport`, so the
   * panel takes its natural content height. Used by the styled `Tray`.
   * @defaultValue `false`
   */
  fitContent?: boolean
}
</script>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { runOnBackground, runOnMainThread, useMainThreadRef } from 'vue-lynx'

import {
  PresenceContextKey,
  PresenceState,
  presenceClassVariants,
} from '@/components/Presence'
import {
  directionAxis,
  directionCloseSign,
  useA11y,
  useSafeArea,
  viewportSnapsToPositions,
} from '@/shared/composables'
import { clamp } from '@/shared/clamp'
import { injectSheetRootContext, provideSheetDragContext } from './sheetContext'

const props = withDefaults(defineProps<SheetContentImplProps>(), {
  dragDisabled: false,
  fitContent: false,
})

const ctx = injectSheetRootContext()

const presence = inject(PresenceContextKey, null)

const presenceState = computed<PresenceState>(() =>
  presence?.controllers.state.value ?? PresenceState.Entered,
)

// `transition: false` emits no `ui-leaving`, so no slide-out keyframe. After a
// drag dismiss the MT release transition is already sliding the panel off; the
// keyframe would replay the close from fully open. Inline `animation: none`
// can't suppress it — a class-driven animation beats inline on the Lynx style
// path — so the class is removed instead.
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

// Side is expressed as a class, not just `data-side`: Lynx native doesn't
// match `[data-side=…]` attribute selectors in CSS (same limitation that
// drove the `ui-*` state-class migration, issue #9), so the edge-placement
// and per-side slide keyframes below must key off a class to fire on device.
const sideClass = computed(() => `vyui-sheet__content--${ctx.side.value}`)

const maxSnap = computed(() => {
  const snaps = ctx.snapPoints.value
  return snaps.length > 0 ? snaps[snaps.length - 1] ?? 1 : 1
})

const axis = computed(() => directionAxis(ctx.side.value))
const closeSign = computed(() => directionCloseSign(ctx.side.value))

// Safe-area: keep content clear of the hardware insets on the edges the panel
// docks against. Insets are zero outside Sparkling / Lynx Explorer.
const safeArea = useSafeArea()
const safeAreaStyle = computed(() => {
  const side = ctx.side.value
  const pad: Record<string, string> = {}
  if (safeArea.bottom > 0 && side !== 'top')
    pad.paddingBottom = `${safeArea.bottom}px`
  if (safeArea.top > 0 && side !== 'bottom')
    pad.paddingTop = `${safeArea.top}px`
  return pad
})

// Panel extent as a viewport string, from the largest snap fraction. Vertical
// sheets must use `vh`, not `dvh` — Lynx native drops the dynamic-viewport
// unit and collapses the panel to its content height.
const panelStyle = computed(() => {
  // Inline longhand overrides the 280ms in the enter/leave keyframe
  // shorthands below, so the CSS default and the MT settle paths (which
  // read `durationMsRef`) can't desync when a consumer sets `duration`.
  const duration = { animationDuration: `${ctx.duration.value}ms` }
  // Content-hug: emit no explicit extent. `@layoutchange` still feeds
  // `panelExtentPx`, so drag threshold and backdrop fade track the real height.
  if (props.fitContent) return { ...safeAreaStyle.value, ...duration }
  const size = `${maxSnap.value * 100}${axis.value === 'x' ? 'vw' : 'vh'}`
  return {
    ...safeAreaStyle.value,
    ...duration,
    [axis.value === 'x' ? 'width' : 'height']: size,
  }
})

// `SystemInfo` is not reactive, but the panel receives a layout event whenever
// dynamic viewport units resolve to a new size after rotation. Feed that
// measured size back into the snap/drag geometry so visual layout and MT
// physics stay in sync.
const measuredPanelHeight = ref(0)
const measuredPanelWidth = ref(0)

function onPanelLayout(event: { detail?: { height?: number, width?: number } } | undefined) {
  const height = event?.detail?.height
  const width = event?.detail?.width
  if (typeof height === 'number' && height > 0) measuredPanelHeight.value = height
  if (typeof width === 'number' && width > 0) measuredPanelWidth.value = width
}

// Whether the content view binds touch handlers. With multiple snap points drag
// stays enabled even when drag-to-close is off — only the dismiss branch is
// gated (by `enableDragToCloseRef` inside `_onTouchEnd`).
const isDragEnabled = computed(() =>
  !props.dragDisabled
  && !ctx.handleOnly.value
  && (ctx.enableDragToClose.value || ctx.snapPoints.value.length > 1),
)

// All read/written only inside `'main thread'` worklets that fire on user
// input. By that time, the `INIT_MT_REF` ops below have been flushed.
const containerRef = useMainThreadRef<any>(null)
const touchStartAxisRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
// Ring-buffer for velocity, `[y, timestampMs]`, trailing 50ms of samples.
const sampleRingRef = useMainThreadRef<Array<[number, number]>>([])
const axisRef = useMainThreadRef<'x' | 'y'>(axis.value)
const closeSignRef = useMainThreadRef<1 | -1>(closeSign.value)

// Root-owned MT refs (INIT_MT_REF-registered by SheetRoot). Bound to local
// consts so the worklet transform captures the MainThreadRef, not the context.
const backdropRef = ctx.backdropElRef
const progressRef = ctx.progressMTRef

const viewportExtent = computed(() => axis.value === 'x'
  ? ctx.viewportWidth.value
  : ctx.viewportHeight.value)

const panelExtentPx = computed(() => {
  const measured = axis.value === 'x' ? measuredPanelWidth.value : measuredPanelHeight.value
  if (measured > 0) return Math.round(measured)
  return Math.round(viewportExtent.value * maxSnap.value)
})
const panelExtentPxRef = useMainThreadRef<number>(panelExtentPx.value)

// Snap positions in px-from-open, ascending (`[0]` = most open = 0, since the
// panel is sized to the largest snap).
const snapPositionsPx = computed(() =>
  viewportSnapsToPositions(
    ctx.snapPoints.value,
    panelExtentPx.value > 0
      ? panelExtentPx.value / maxSnap.value
      : viewportExtent.value,
    panelExtentPx.value,
  ),
)

// Position (px-from-open) that BG's `snapIndex` points at. `ctx.snapIndex`
// is fraction-ordered (0 = smallest fraction = most CLOSED); positions are
// most-open-first, hence the index flip.
const snapTargetPos = computed(() => {
  const positions = snapPositionsPx.value
  const idx = clamp(ctx.snapIndex.value, 0, positions.length - 1)
  return positions[positions.length - 1 - idx] ?? 0
})

const dismissVelocityRef = useMainThreadRef<number>(ctx.dismissVelocity.value)
const durationMsRef = useMainThreadRef<number>(ctx.duration.value)
const snapPositionsRef = useMainThreadRef<number[]>(snapPositionsPx.value)
const enableDragToCloseRef = useMainThreadRef<boolean>(ctx.enableDragToClose.value)

// Authoritative panel position, px-from-open (0 = fully open), written the
// moment a move is COMMITTED. BG cannot read it, so BG-initiated moves
// dispatch to MT and decide against it there.
const posRef = useMainThreadRef<number>(0)
const touchStartPosRef = useMainThreadRef<number>(0)

// Timestamp of the last real touch. Touch browsers replay a tap as a
// compatibility mousedown/mouseup pair after touchend; mouse handlers ignore
// events inside this window so a tap can't double-run the release decision.
const lastTouchTsRef = useMainThreadRef<number>(0)

// vue-lynx@0.4.0 silently drops BG writes to `MainThreadRef.current` (only the
// constructor's INIT_MT_REF transfers BG → MT), so these syncs hop through
// `runOnMainThread`.

function _setPanelExtentPx(v: number) {
  'main thread'
  panelExtentPxRef.current = v
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

function _setAxis(v: 'x' | 'y') {
  'main thread'
  axisRef.current = v
}

function _setCloseSign(v: 1 | -1) {
  'main thread'
  closeSignRef.current = v
}

watch(panelExtentPx, (v) => { void runOnMainThread(_setPanelExtentPx as any)(v) })
watch(ctx.dismissVelocity, (v) => { void runOnMainThread(_setDismissVelocity as any)(v) })
watch(ctx.duration, (v) => { void runOnMainThread(_setDurationMs as any)(v) })
watch(snapPositionsPx, (v) => { void runOnMainThread(_setSnapPositions as any)(v) })
watch(ctx.enableDragToClose, (v) => { void runOnMainThread(_setEnableDragToClose as any)(v) })
watch(axis, (v) => { void runOnMainThread(_setAxis as any)(v) })
watch(closeSign, (v) => { void runOnMainThread(_setCloseSign as any)(v) })

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

// Paints the backdrop from the content's touch worklets, through a ref
// populated by a sibling component (`SheetBackdropImpl`'s `:main-thread-ref`).
function _setBackdropStyle(decl: Record<string, string>) {
  'main thread'
  // The backdrop is optional and unmounts with Presence on close.
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

function _axisCoord(x: number, y: number) {
  'main thread'
  return axisRef.current === 'x' ? x : y
}

function _translate(position: number) {
  'main thread'
  const signed = closeSignRef.current * position
  return axisRef.current === 'x' ? `translateX(${signed}px)` : `translateY(${signed}px)`
}

function _translateClosed() {
  'main thread'
  const value = closeSignRef.current === 1 ? '100%' : '-100%'
  return axisRef.current === 'x' ? `translateX(${value})` : `translateY(${value})`
}

function _pruneRing(now: number) {
  'main thread'
  const ring = sampleRingRef.current
  while (ring.length > 2 && ring[0][1] < now - 50) ring.shift()
}

// Start a settle / dismiss transition GUARANTEED to animate from the live drag
// position. CSS transitions interpolate from the last COMMITTED value; on a
// fast flick (touchstart → move → end in one frame) the `translateY(pos)`
// writes never commit, so the transition would run from `translateY(0)`. Frame
// 1 re-pins panel + backdrop with `transition: none`, then a frame boundary
// commits that pin, and frame 2 runs the eased move from there.
function _settleTo(
  target: number,
  toTransform: string,
  ms: number,
  easing: string,
  clearAnim: boolean,
) {
  'main thread'
  const extentPx = panelExtentPxRef.current
  // Frame 1: pin to where the finger left the panel (kills any keyframe too).
  _setStyle({ animation: 'none', transition: 'none', transform: _translate(posRef.current) })
  let p0 = extentPx > 0 ? 1 - posRef.current / extentPx : 1
  if (p0 < 0) p0 = 0
  if (p0 > 1) p0 = 1
  _setBackdropStyle({ transition: 'none', opacity: String(p0) })
  posRef.current = target
  let progress = extentPx > 0 ? 1 - target / extentPx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  // Frame 2: baseline is now committed — run the eased settle from it.
  function apply() {
    _setStyle({
      animation: clearAnim ? '' : 'none',
      transition: `transform ${ms}ms ${easing}`,
      transform: toTransform,
    })
    _setBackdropStyle({
      transition: `opacity ${ms}ms ${easing}`,
      opacity: String(progress),
    })
  }
  // Double rAF: on web a single rAF fires BEFORE the frame's style commit, so
  // the pin never becomes the transition baseline. Native just holds the pin
  // one extra frame at the release position.
  function hop() {
    requestAnimationFrame(apply)
  }
  requestAnimationFrame(hop)
}

function _dragStart(x: number, y: number) {
  'main thread'
  isDraggingRef.current = true
  const coord = _axisCoord(x, y)
  touchStartAxisRef.current = coord
  sampleRingRef.current = [[coord, Date.now()]]
  touchStartPosRef.current = posRef.current
  // Kill any in-flight transition AND re-assert the last COMMITTED position:
  // without it the engine keeps painting from the interpolated transform and
  // fights the `touchmove` writes. MT can't read that interpolated value, so a
  // mid-settle grab snaps to the settle's target and drags from there.
  _setStyle({ transition: 'none', transform: _translate(posRef.current) })
  // The backdrop joins the drag: kill its transition so the per-frame opacity
  // writes paint immediately.
  _setBackdropStyle({ transition: 'none' })
}

function _dragMove(x: number, y: number) {
  'main thread'
  if (!isDraggingRef.current) return
  const coord = _axisCoord(x, y)
  // Position = drag origin + finger delta, clamped to the travel range:
  // 0 (fully open — no snap above it) … panel extent (fully off-screen).
  const extentPx = panelExtentPxRef.current
  let pos = touchStartPosRef.current + (coord - touchStartAxisRef.current) * closeSignRef.current
  if (pos < 0) pos = 0
  if (pos > extentPx) pos = extentPx
  posRef.current = pos
  _setStyle({ transform: _translate(pos) })
  // Drag-synced backdrop fade: 1 = fully open, 0 = dragged the full panel
  // extent. Mirrored into the context's progressMTRef for other MT readers.
  let progress = extentPx > 0 ? 1 - pos / extentPx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  _setBackdropStyle({ opacity: String(progress) })
  const now = Date.now()
  sampleRingRef.current.push([coord, now])
  _pruneRing(now)
}

function _dragEnd() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false

  // Velocity from ring buffer (px/s). Positive = toward close.
  const ring = sampleRingRef.current
  let velocity = 0
  if (ring.length >= 2) {
    const first = ring[0]
    const last = ring[ring.length - 1]
    const dt = (last[1] - first[1]) / 1000
    if (dt > 0) velocity = ((last[0] - first[0]) / dt) * closeSignRef.current
  }

  const pos = posRef.current
  const extentPx = panelExtentPxRef.current
  const positions = snapPositionsRef.current
  const durationMs = durationMsRef.current

  // Release decision — MIRRORS `pickRelease` in useSheetBehavior.ts (worklets
  // can't import it — keep the two in sync), minus the "≥15px past most-closed"
  // mouse fallback, which would dismiss a touch sheet on a 16px sag.
  const projected = pos + velocity * 0.1
  const mostClosed = positions.length > 0 ? positions[positions.length - 1] : 0
  // Distance past the most-closed snap that dismisses with no velocity.
  const shouldDismiss = enableDragToCloseRef.current
    && (velocity >= dismissVelocityRef.current
      || projected > mostClosed + extentPx * 0.4)

  // Settle timing scales with release speed; a slow release clamps to
  // `durationMs`. Floored at 120ms. MIRRORS `settleDurationMs` in physics.ts
  // (worklets can't import it — keep in sync).
  const MIN_SETTLE_MS = 120
  if (shouldDismiss) {
    let base = (Math.abs(extentPx - pos) / Math.max(Math.abs(velocity), 0.001)) * 1000
    if (base < MIN_SETTLE_MS) base = MIN_SETTLE_MS
    if (base > durationMs) base = durationMs
    const dismissMs = Math.round(base * 0.9)
    // Slide off from the live drag position; `animation: none` suppresses the
    // `.ui-leaving` keyframe. `@transitionend` advances Presence to `Left`.
    _settleTo(extentPx, _translateClosed(), dismissMs, 'ease-in', false)
    runOnBackground(_emitClose as any)()
  }
  else {
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
    let settleMs = (Math.abs(target - pos) / Math.max(Math.abs(velocity), 0.001)) * 1000
    if (settleMs < MIN_SETTLE_MS) settleMs = MIN_SETTLE_MS
    if (settleMs > durationMs) settleMs = durationMs
    // Below fully open, inline `animation: none` stays on so a later non-drag
    // close can't start `.ui-leaving` from translateY(0); at fully open it is
    // cleared so the keyframe paths apply again.
    _settleTo(target, _translate(target), Math.round(settleMs), 'ease-out', target === 0)
    runOnBackground(_settle as any)(idx)
  }
}

function _dragCancel() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false
  // Cancel returns to the snap the drag started from, at 0.7× the settle
  // duration. Goes through `_settleTo` so a cancelled flick animates from the
  // live position.
  const target = touchStartPosRef.current
  const cancelMs = Math.round(durationMsRef.current * 0.7)
  _settleTo(target, _translate(target), cancelMs, 'ease-out', target === 0)
}

// Thin per-modality wrappers over the gesture cores above (worklets can only
// reference previously-defined worklets, so these must follow them).
function _onTouchStart(e: { detail: { x?: number, y?: number } }) {
  'main thread'
  _dragStart(e.detail.x ?? 0, e.detail.y ?? 0)
}

function _onTouchMove(e: { detail: { x?: number, y?: number } }) {
  'main thread'
  _dragMove(e.detail.x ?? 0, e.detail.y ?? 0)
}

function _onTouchEnd() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _dragEnd()
}

function _onTouchCancel() {
  'main thread'
  lastTouchTsRef.current = Date.now()
  _dragCancel()
}

// Desktop web: Lynx web dispatches raw mouse events and never synthesizes touch
// from them. Coordinates arrive top-level (mouse `detail` is the click-count
// number). No mouseleave binding — it doesn't bubble, so per-element delivery
// is unreliable on the Lynx dispatch path.
function _onMouseDown(e: { clientX: number, clientY: number, buttons?: number }) {
  'main thread'
  // Swallow the compatibility mousedown a touch browser replays after a tap.
  if (Date.now() - lastTouchTsRef.current < 500) return
  // Primary button only: a right/middle press would start a phantom drag that
  // the next hover move then "releases".
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) return
  _dragStart(e.clientX, e.clientY)
}

function _onMouseMove(e: { clientX: number, clientY: number, buttons?: number }) {
  'main thread'
  // Only an EXPLICIT buttons value with the primary bit clear counts as
  // released (recovers the mouseup lost outside the <lynx-view>). A missing
  // `buttons` is treated as still-pressed — trackpad/synthetic moves can omit
  // it, and ending on those lets the drag go mid-gesture.
  if (typeof e.buttons === 'number' && (e.buttons & 1) === 0) {
    _dragEnd()
    return
  }
  _dragMove(e.clientX, e.clientY)
}

function _onMouseUp() {
  'main thread'
  _dragEnd()
}

// Programmatic move (BG `snapIndex` watch / post-enter sync). Skips while
// dragging, and skips the echo after a settle (`posRef` already equals it).
function _jumpToSnap(target: number) {
  'main thread'
  if (isDraggingRef.current) return
  if (target === posRef.current) return
  posRef.current = target
  const ms = durationMsRef.current
  _setStyle({
    animation: target === 0 ? '' : 'none',
    transition: `transform ${ms}ms ease-out`,
    transform: _translate(target),
  })
  const extentPx = panelExtentPxRef.current
  let progress = extentPx > 0 ? 1 - target / extentPx : 1
  if (progress < 0) progress = 0
  if (progress > 1) progress = 1
  progressRef.current = progress
  _setBackdropStyle({
    transition: `opacity ${ms}ms ease-out`,
    opacity: String(progress),
  })
}

// Non-drag close while the panel sits below fully open: settles below fully
// open leave inline `animation: none` on the panel, so the `.ui-leaving`
// keyframe never starts and this transition drives the close instead. Bails at
// fully open (keyframe path) and at >= panel height (dismiss already running).
function _slideOffFromCurrent() {
  'main thread'
  if (isDraggingRef.current) return
  const pos = posRef.current
  const extentPx = panelExtentPxRef.current
  if (pos === 0 || pos >= extentPx) return
  posRef.current = extentPx
  const ms = Math.round(durationMsRef.current * 0.9)
  _setStyle({
    animation: 'none',
    transition: `transform ${ms}ms ease-in`,
    transform: _translateClosed(),
  })
  progressRef.current = 0
  _setBackdropStyle({
    transition: `opacity ${ms}ms ease-in`,
    opacity: '0',
  })
}

function _emitClose() {
  // Before `setOpen`, so the class computed sees it in the same tick and the
  // `.ui-leaving` keyframes never get a frame to replay this close.
  ctx.dragClosing.value = true
  ctx.setOpen(false)
}

// Drag settle → BG snapIndex. `ascIdx` indexes the most-open-first positions
// array; flip back to the fraction-ordered ctx convention.
function _settle(ascIdx: number) {
  const n = ctx.snapPoints.value.length
  const ctxIdx = clamp(n - 1 - ascIdx, 0, n - 1)
  if (ctx.snapIndex.value !== ctxIdx) ctx.snapIndex.value = ctxIdx
}

// BG-initiated moves. While Entering the slide-in keyframe owns the transform
// (inline writes lose to an active animation), so those are deferred to the
// Entered re-sync below.
watch(snapTargetPos, (pos) => {
  if (presenceState.value !== PresenceState.Entered) return
  void runOnMainThread(_jumpToSnap as any)(pos)
})

// Entered re-sync: the enter keyframe always lands at translateY(0). If
// snapIndex points below that — preset before open, or changed mid-enter —
// ease down to it now.
watch(presenceState, (s) => {
  if (s === PresenceState.Entered && snapTargetPos.value !== 0) {
    void runOnMainThread(_jumpToSnap as any)(snapTargetPos.value)
  }
})

// Non-drag close hook for `_slideOffFromCurrent`. Dispatch unconditionally —
// only MT knows the real position.
watch(() => ctx.open.value, (isOpen) => {
  if (!isOpen) void runOnMainThread(_slideOffFromCurrent as any)()
})

// SheetHandle uses the same MT gesture handlers when handleOnly is true.
provideSheetDragContext({
  handleTouchStartMT: _onTouchStart,
  handleTouchMoveMT: _onTouchMove,
  handleTouchEndMT: _onTouchEnd,
  handleMouseDownMT: _onMouseDown,
  handleMouseMoveMT: _onMouseMove,
  handleMouseUpMT: _onMouseUp,
})

const handlers = presence?.animationHandlers

// Modal panel: announce as a dialog and trap a11y focus to the sheet.
const a11y = useA11y(() => ({
  role: 'dialog',
  exclusiveFocus: true,
}))
</script>

<template>
  <view
    class="vyui-sheet__content"
    :class="[presenceClass, sideClass]"
    v-bind="a11y"
    :data-state="dataState"
    :data-side="ctx.side.value"
    data-vyui-sheet-content
    :main-thread-ref="containerRef"
    :main-thread-bindtouchstart="isDragEnabled ? _onTouchStart : undefined"
    :main-thread-bindtouchmove="isDragEnabled ? _onTouchMove : undefined"
    :main-thread-bindtouchend="isDragEnabled ? _onTouchEnd : undefined"
    :main-thread-bindtouchcancel="isDragEnabled ? _onTouchCancel : undefined"
    :main-thread-bindmousedown="isDragEnabled ? _onMouseDown : undefined"
    :main-thread-bindmousemove="isDragEnabled ? _onMouseMove : undefined"
    :main-thread-bindmouseup="isDragEnabled ? _onMouseUp : undefined"
    :event-through="false"
    :style="panelStyle"
    @layoutchange="onPanelLayout"
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
/* No `background-color` — @vyui/core is headless and ships no color. A value
   here beats the consumer's `bg-default` on source order. */
.vyui-sheet__content {
  position: fixed;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Default off-screen — hidden until ui-entering's keyframe slides it in.
     The `both` fill-mode on the keyframes holds the slid position after. */
  transform: translateY(100%);
}

/* `flex-direction` places the drag handle (SheetContent's first child) on the
   sheet's inner edge, flipped per side. */
.vyui-sheet__content--bottom {
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  flex-direction: column;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transform: translateY(100%);
}

.vyui-sheet__content--top {
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  flex-direction: column-reverse;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  transform: translateY(-100%);
}

.vyui-sheet__content--right {
  top: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  flex-direction: row;
  border-top-left-radius: 16px;
  border-bottom-left-radius: 16px;
  transform: translateX(100%);
}

.vyui-sheet__content--left {
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
  flex-direction: row-reverse;
  border-top-right-radius: 16px;
  border-bottom-right-radius: 16px;
  transform: translateX(-100%);
}

.vyui-sheet__content.ui-open {
  transform: translate(0, 0);
}

/* Underlying transform while leaving. The slide-out keyframes omit their `from`
   step so they animate from this value — or from the live inline `transform`,
   which outranks this rule, when a drag settles the panel off. */
.vyui-sheet__content.ui-leaving {
  transform: translate(0, 0);
}

.vyui-sheet__content--bottom.ui-entering {
  animation: vyui-sheet-slide-in 280ms ease-out both;
}

.vyui-sheet__content--bottom.ui-leaving {
  animation: vyui-sheet-slide-out 280ms ease-in both;
}

.vyui-sheet__content--top.ui-entering {
  animation: vyui-sheet-slide-in-from-top 280ms ease-out both;
}

.vyui-sheet__content--top.ui-leaving {
  animation: vyui-sheet-slide-out-to-top 280ms ease-in both;
}

.vyui-sheet__content--right.ui-entering {
  animation: vyui-sheet-slide-in-from-right 280ms ease-out both;
}

.vyui-sheet__content--right.ui-leaving {
  animation: vyui-sheet-slide-out-to-right 280ms ease-in both;
}

.vyui-sheet__content--left.ui-entering {
  animation: vyui-sheet-slide-in-from-left 280ms ease-out both;
}

.vyui-sheet__content--left.ui-leaving {
  animation: vyui-sheet-slide-out-to-left 280ms ease-in both;
}

@keyframes vyui-sheet-slide-in {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

/* Slide-out keyframes intentionally omit `from` — see `.ui-leaving` above. */
@keyframes vyui-sheet-slide-out {
  to { transform: translateY(100%); }
}

@keyframes vyui-sheet-slide-in-from-top {
  from { transform: translateY(-100%); }
  to   { transform: translateY(0); }
}

@keyframes vyui-sheet-slide-out-to-top {
  to { transform: translateY(-100%); }
}

@keyframes vyui-sheet-slide-in-from-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes vyui-sheet-slide-out-to-right {
  to { transform: translateX(100%); }
}

@keyframes vyui-sheet-slide-in-from-left {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}

@keyframes vyui-sheet-slide-out-to-left {
  to { transform: translateX(-100%); }
}
</style>
