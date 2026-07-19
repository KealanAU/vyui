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
  /**
   * Hug content instead of sizing the panel to `snapPoints × viewport`. The
   * panel takes its natural content height (a bottom sheet grows upward from
   * the edge). Drag/slide/backdrop are unaffected: the drag physics already
   * read the panel's MEASURED extent via `@layoutchange`, and the slide
   * keyframes translate by `100%` of whatever that height resolves to. Used
   * by the styled `Tray`, whose per-view height morph needs the panel to
   * follow its content rather than a fixed viewport fraction.
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

// Size of the panel as a viewport string, derived from the largest snap
// fraction. e.g. `snapPoints: [0.75]` → `height: 75vh` for vertical sheets
// or `width: 75vw` for horizontal sheets. NOTE: vertical sheets must use
// `vh`, not `dvh` — Lynx native drops the dynamic-viewport unit, collapsing
// the panel to its content height.
const panelStyle = computed(() => {
  // Inline longhand overrides the 280ms in the enter/leave keyframe
  // shorthands below, so the CSS default and the MT settle paths (which
  // read `durationMsRef`) can't desync when a consumer sets `duration`.
  const duration = { animationDuration: `${ctx.duration.value}ms` }
  // Content-hug mode: emit no explicit extent so the panel takes its natural
  // content size. `measuredPanelHeight/Width` (from `@layoutchange`) still
  // feeds `panelExtentPx`, so the drag threshold and backdrop-fade progress
  // track the real hugged height.
  if (props.fitContent) return duration
  const size = `${maxSnap.value * 100}${axis.value === 'x' ? 'vw' : 'vh'}`
  return { ...duration, [axis.value === 'x' ? 'width' : 'height']: size }
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

// All read/written only inside `'main thread'` worklets that fire on user
// input. By that time, the `INIT_MT_REF` ops below have been flushed.
const containerRef = useMainThreadRef<any>(null)
const touchStartAxisRef = useMainThreadRef<number>(0)
const isDraggingRef = useMainThreadRef<boolean>(false)
// Ring-buffer for velocity. Each entry is `[y, timestampMs]`. We keep the
// trailing 50ms of touch samples.
const sampleRingRef = useMainThreadRef<Array<[number, number]>>([])
const axisRef = useMainThreadRef<'x' | 'y'>(axis.value)
const closeSignRef = useMainThreadRef<1 | -1>(closeSign.value)

// Root-owned MT refs (created and INIT_MT_REF-registered by SheetRoot).
// Bound to local consts so the worklet transform captures the
// MainThreadRef itself rather than the whole BG context object.
const backdropRef = ctx.backdropElRef
const progressRef = ctx.progressMTRef

const viewportExtent = computed(() => axis.value === 'x'
  ? ctx.viewportWidth.value
  : ctx.viewportHeight.value)

// Panel extent in px on MT (for the dismiss threshold and backdrop fade
// progress). Recomputes on rotation / late-resolving SystemInfo /
// snapPoint changes; the watch below re-syncs it to MT.
const panelExtentPx = computed(() => {
  const measured = axis.value === 'x' ? measuredPanelWidth.value : measuredPanelHeight.value
  if (measured > 0) return Math.round(measured)
  return Math.round(viewportExtent.value * maxSnap.value)
})
const panelExtentPxRef = useMainThreadRef<number>(panelExtentPx.value)

// Snap positions in px-from-open, ascending (`[0]` = most open = 0, since
// the panel is sized to the largest snap). Resolved by the unit-tested
// helper; mirrored to MT for the release worklet.
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

// Release physics from SheetRoot's props. Flick-advance needs no velocity
// threshold — `pickRelease` (and the worklet mirror of it) implements it
// via the coast projection instead.
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

// vue-lynx@0.4.0 silently drops BG-thread writes to `MainThreadRef.current`
// (only the constructor's INIT_MT_REF transfers a value BG → MT), so these
// syncs have to hop through `runOnMainThread`. That's safe here: watch
// callbacks fire post-mount, long after the refs are registered — the
// setup-time dispatch race in the header comment doesn't apply.

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

// Paints a SECOND element (the backdrop) from the content's touch worklets:
// the same setStyleProperty surface as the panel, but through a ref populated
// by a sibling component (`SheetBackdropImpl`'s `:main-thread-ref`).
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

function _axisCoord(e: { detail: { x?: number, y?: number } }) {
  'main thread'
  return axisRef.current === 'x' ? e.detail.x ?? 0 : e.detail.y ?? 0
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

// Start a settle / dismiss transition that is GUARANTEED to animate from the
// live drag position. CSS transitions interpolate from the property's last
// COMMITTED value; on a fast flick — touchstart → touchmove → touchend all
// land in one frame — the per-`touchmove` `translateY(pos)` writes never
// commit a baseline, so a transition started in `_onTouchEnd` interpolates
// from `translateY(0)` instead: the panel flashes back to full size for a
// frame before sliding off. (Slow drags paint across many frames, commit a
// baseline, and never hit this.) So: frame 1 re-pins the panel + backdrop to
// the live position with `transition: none`, then `requestAnimationFrame`
// crosses a frame boundary so that pin commits, and frame 2 runs the eased
// move from there. Mirrors the explicit-from keyframes SwipeAction builds for
// the same reason. `toTransform` is the literal end transform (dismiss uses
// `translateY(100%)`; settles use `translateY(<target>px)`).
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
  requestAnimationFrame(apply)
}

function _onTouchStart(e: { detail: { x?: number, y?: number } }) {
  'main thread'
  isDraggingRef.current = true
  const coord = _axisCoord(e)
  touchStartAxisRef.current = coord
  sampleRingRef.current = [[coord, Date.now()]]
  touchStartPosRef.current = posRef.current
  // Kill any in-flight transition AND re-assert the last COMMITTED position.
  // Without re-asserting the transform here, touching mid-settle inherits
  // whatever intermediate transform the CSS transition was computing — the
  // engine can keep painting from that interpolated value, fighting our
  // subsequent `touchmove` writes, so drag doesn't "pick up". We can't read
  // the interpolated transform on MT, so a mid-settle grab snaps to the
  // settle's target (`posRef` is written eagerly at release) and drags from
  // there — a small jump in the worst case, never a stuck panel.
  _setStyle({ transition: 'none', transform: _translate(posRef.current) })
  // The backdrop joins the drag: kill its transition so the per-frame
  // opacity writes in touchmove paint immediately instead of easing.
  _setBackdropStyle({ transition: 'none' })
}

function _onTouchMove(e: { detail: { x?: number, y?: number } }) {
  'main thread'
  if (!isDraggingRef.current) return
  const coord = _axisCoord(e)
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

function _onTouchEnd() {
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
      || projected > mostClosed + extentPx * 0.4)

  // Settle timings derive from SheetRoot's `duration` prop: snap settle uses
  // the full duration; dismiss is a slightly quicker 0.9× cut (matches the
  // previous hardcoded 280 / 250ms feel at the default duration).
  if (shouldDismiss) {
    const dismissMs = Math.round(durationMs * 0.9)
    // Slide off from the live drag position (`animation: none` suppresses the
    // `.ui-leaving` keyframe so it can't snap to translateY(0) first; the
    // frame-1 re-pin in `_settleTo` guards the flick case). `@transitionend`
    // then advances Presence to `Left`, which unmounts the backdrop too — so
    // the inline opacity we fade to 0 here can't leak into the next open.
    _settleTo(extentPx, _translateClosed(), dismissMs, 'ease-in', false)
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
    // Below fully open, inline `animation: none` stays on the panel so a
    // later non-drag close can't start `.ui-leaving` from translateY(0)
    // (`_slideOffFromCurrent` drives those closes). At fully open the
    // inline animation is cleared (empty-string value) so the keyframe paths
    // apply again.
    _settleTo(target, _translate(target), durationMs, 'ease-out', target === 0)
    runOnBackground(_settle as any)(idx)
  }
}

function _onTouchCancel() {
  'main thread'
  if (!isDraggingRef.current) return
  isDraggingRef.current = false
  // Cancel returns to the position the drag STARTED from (always a snap),
  // faster than a deliberate release — 0.7× the settle duration (matches
  // the previous hardcoded 200ms at the 280ms default). Goes through
  // `_settleTo` so a cancelled flick animates from the live position rather
  // than flashing back to full size first.
  const target = touchStartPosRef.current
  const cancelMs = Math.round(durationMsRef.current * 0.7)
  _settleTo(target, _translate(target), cancelMs, 'ease-out', target === 0)
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
// snap" story: slide fully in, then settle down. The dispatch rides a
// different channel than the Entered class patch, so the first frames of the
// settle may still be masked by the outgoing keyframe.
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
.vyui-sheet__content {
  position: fixed;
  z-index: 1001;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* Default off-screen — hidden until ui-entering's keyframe slides it in.
     The `both` fill-mode on the keyframes holds the slid position after. */
  transform: translateY(100%);
}

/* `flex-direction` places the drag handle (SheetContent's first child) on the
   sheet's inner edge: column keeps it at the top for a bottom sheet, and each
   variant flips the axis / reverses so it sits on the edge the sheet is pulled
   toward (bottom for `top`, left for `right`, right for `left`). */
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

/* Underlying transform while leaving. The slide-out keyframes below omit their
   `from` step so they animate from this value — the fully-open position for a
   plain close, or the live inline `transform` (which outranks this rule) when a
   drag settles the panel off. A hardcoded `from: translate(0)` would instead
   snap a mid-drag panel back to full-open for a frame before sliding out — the
   flash — whenever the inline `animation: none` on the drag path fails to
   suppress this keyframe (animations outrank transitions for `transform`). */
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

/* Slide-out keyframes intentionally omit `from` — they start from the panel's
   current transform (see `.ui-leaving` above) so a drag-settled close never
   flashes back to full-open. */
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
