// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported 1:1 from `lynx-family/lynx-ui`
// `packages/lynx-ui-presence/src/usePresence.tsx`. Vue/Lynx mapping:
//
//   React                 →  Vue
//   --------------------     --------------------
//   useState               → ref()
//   useRef                 → plain `{ current }` (mutable, non-reactive)
//   useEffect([state])     → watch(state, ...)
//   useEffect([show, ...]) → watch([show, enableDelay], ..., { immediate: false })
//   useEffect([])          → onMounted (initial-render flag only)
//   showRef/stateRef       → (dropped) upstream mirrors these into refs because
//                            a `useState` value is frozen into the closure of
//                            the render that scheduled a callback. `show` and
//                            `state` are Refs here, so `.value` is always live.
//
// The composable is invoked once per Presence instance in `setup()`. Reactive
// inputs (`show`, `state`, `enableDelay`) are passed as Vue `Ref`s so the
// watches inside fire on changes — matching the React effect semantics.

import type { Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'

import { delayFrames, log } from '@/shared'
import type {
  PresenceContextType,
  UsePresenceReturnType,
} from './types'
import { PresenceState } from './utils'

/**
 * Reactive options accepted by {@link usePresence}. Mirrors `UsePresenceOptions`
 * but each driving field is a `Ref` — required so the composable can `watch`
 * them across the lifetime of the host component.
 */
export interface UsePresenceRefOptions {
  show: Ref<boolean>
  state: Ref<PresenceState>
  setPresenceState: (state: PresenceState) => void
  enableDelay?: Ref<boolean>
  onOpen?: () => void
  onClose?: () => void
  debugLog?: boolean
}

/**
 * The maximum number of frames `handleStateEntering`/`handleStateLeaving`
 * will wait for a real `bindanimationstart` / `bindtransitionstart` before
 * giving up and force-progressing the state machine. 24 frames ≈ 400ms at
 * 60fps — long enough to absorb a slow first paint, short enough that
 * elements without an animation don't hang in Entering/Leaving.
 */
export const MAX_WAIT_FRAMES = 24

/**
 * Absolute wall-clock ceiling on how long Entering/Leaving may stay
 * unresolved while an animation is (or claims to be) in flight. On web,
 * end/cancel events can be lost outright — a child unmounted mid-transition
 * never delivers its end, and DOM bubbling feeds child animation events into
 * these handlers in the first place — which would otherwise wedge the machine
 * forever (a stuck Leaving keeps the invisible backdrop mounted, eating every
 * tap under it). Wall-clock, not frames: rAF cadence varies wildly across
 * environments (jsdom chains near-instantly; 120Hz devices double-tick). 3s
 * is far above any real enter/leave animation, so it only fires on genuinely
 * lost events. Not in upstream lynx-ui as of 2026-07.
 */
export const MAX_STUCK_MS = 3000

/**
 * The core animation state machine for `<Presence>`.
 *
 * Listens to `bindanimationstart` / `bindanimationend` / `bindanimationcancel`
 * (`handleKFStart` / `handleKFEnd` / `handleKFCancel`) and the corresponding
 * `bindtransition*` events (Lynx fires these natively on `<view>`). When one
 * of them resolves and no other animation is in flight, the state advances:
 *
 *   Entering / DelayedEntering → Entered
 *   Leaving                    → Left
 *
 * If no animation fires for {@link MAX_WAIT_FRAMES} frames after entering one
 * of those states, the state advances anyway so unanimated content doesn't
 * hang on screen.
 *
 * Race protection — `enteringLoopIdRef` / `leavingLoopIdRef` /
 * `showScheduleIdRef` are incremented on every relevant trigger; in-flight
 * `delayFrames` callbacks compare their captured id against the current one
 * and bail out when stale.
 */
export function usePresence(opts: UsePresenceRefOptions): UsePresenceReturnType {
  const {
    show,
    state,
    enableDelay,
    setPresenceState,
    onOpen,
    onClose,
    debugLog = false,
  } = opts

  const getEnableDelay = () => enableDelay?.value ?? false
  const getEnteringStateWithDelay = () =>
    getEnableDelay() ? PresenceState.DelayedEntering : PresenceState.Entering

  log(
    debugLog,
    `[vyui-presence][usePresence] init, show: ${show.value}, state: ${state.value}, enableDelay: ${getEnableDelay()}`,
  )

  // Mutable, non-reactive refs — `useRef` analogue. We deliberately do NOT
  // use Vue `ref()` for these because they're write-during-event-handler
  // values that should never trigger re-render.
  const isTransitionAnimating = { current: false }
  const isKFAnimating = { current: false }
  // Tracks the very first render so onClose doesn't fire when the component
  // first mounts in the terminal Left state.
  const isInitialRender = { current: true }
  // Dedupes open/close notifications across re-entries — a reopen-during-close
  // routes back through Entered without ever reaching Left (upstream parity).
  const hasNotifiedOpen = { current: false }

  // The reactive output: whether the child should render.
  const mount = ref<boolean>(false)

  // Loop-id refs guard against stale `delayFrames` callbacks racing the
  // current animation cycle. Each handler that starts a new wait increments
  // these; the callback exits early if the id has moved on.
  const enteringLoopIdRef = { current: 0 }
  const leavingLoopIdRef = { current: 0 }
  const showScheduleIdRef = { current: 0 }
  const enteringWaitFramesRef = { current: 0 }
  const leavingWaitFramesRef = { current: 0 }

  // ----- helpers ------------------------------------------------------------

  const notAnimating = () =>
    isKFAnimating.current === false && isTransitionAnimating.current === false

  const handleAnimationStart = () => {
    log(
      debugLog,
      `[vyui-presence][usePresence] handleAnimationStart state:${state.value}, show:${show.value}, isTransition:${isTransitionAnimating.current}, isKFAnimating:${isKFAnimating.current}`,
    )
  }

  const handleAnimationEnd = () => {
    const s = state.value
    // Still need to check if the other kind of animation is running.
    if (
      (s === PresenceState.Entering || s === PresenceState.DelayedEntering)
      && notAnimating()
    ) {
      if (show.value) {
        setPresenceState(PresenceState.Entered)
      }
      else {
        // Safeguard: an entering animation may still fire after show turned
        // false. Route through Leaving (not Left) so the leaving animation
        // gets a chance to run instead of being instantly cancelled.
        setPresenceState(PresenceState.Leaving)
      }
    }
    if (s === PresenceState.Leaving && notAnimating()) {
      if (show.value) {
        // show flipped back on while leaving — remount instead of tearing
        // down (upstream parity; see handleStateLeft).
        restartShow()
      }
      else {
        setPresenceState(PresenceState.Left)
      }
    }
  }

  // ----- animation event handlers ------------------------------------------
  // Plain callables — Lynx binds these as the `bindanimation*` /
  // `bindtransition*` listeners on the consumer's root `<view>`.

  // These deliberately do NOT bump the entering/leaving loop ids (upstream
  // lynx-ui does). Bumping killed the frame watchdog the moment any animation
  // started, leaving the machine trusting an end/cancel event that web can
  // lose — see {@link MAX_STUCK_MS}. The watchdogs poll through animations
  // instead.
  const handleKFStart = () => {
    isKFAnimating.current = true
    log(
      debugLog,
      `[vyui-presence][usePresence] KF start, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationStart()
  }

  const handleTransitionStart = () => {
    isTransitionAnimating.current = true
    log(
      debugLog,
      `[vyui-presence][usePresence] Transition start, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationStart()
  }

  const handleKFEnd = () => {
    isKFAnimating.current = false
    log(
      debugLog,
      `[vyui-presence][usePresence] KF end, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleKFCancel = () => {
    isKFAnimating.current = false
    log(
      debugLog,
      `[vyui-presence][usePresence] KF cancel, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleTransitionCancel = () => {
    isTransitionAnimating.current = false
    log(
      debugLog,
      `[vyui-presence][usePresence] Transition cancel, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  const handleTransitionEnd = () => {
    isTransitionAnimating.current = false
    log(
      debugLog,
      `[vyui-presence][usePresence] Transition end, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationEnd()
  }

  // ----- state-side effects -------------------------------------------------

  const handleStateEntered = () => {
    if (hasNotifiedOpen.current) return
    hasNotifiedOpen.current = true
    onOpen?.()
  }

  const handleStateLeft = () => {
    if (show.value) {
      // show flipped back on while we were leaving — remount instead of
      // tearing down. Without this (upstream lynx-ui parity, drifted after
      // the original port), a reopen that races Leaving → Left strands
      // show=true with nothing mounted and the show watcher never re-fires:
      // the trigger goes permanently dead.
      log(
        debugLog,
        '[vyui-presence][usePresence] skip mount=false because show=true (Left)',
      )
      restartShow()
      return
    }
    if (!isInitialRender.current && hasNotifiedOpen.current) {
      hasNotifiedOpen.current = false
      onClose?.()
    }
    log(debugLog, '[vyui-presence][usePresence] set mount=false (Left)')
    mount.value = false
  }

  const handleStateLeaving = () => {
    enteringLoopIdRef.current += 1 // cancel any pending entering wait
    leavingWaitFramesRef.current = 0
    leavingLoopIdRef.current += 1
    const loopId = leavingLoopIdRef.current
    const startedAt = Date.now()
    log(
      debugLog,
      `[vyui-presence][usePresence] leaving loop scheduled, loopId: ${loopId}`,
    )
    const tryLeft = () => {
      // loopId mismatch ⇒ a newer Leaving cycle superseded this one.
      if (loopId !== leavingLoopIdRef.current) return
      // Resolved through the normal end-event path — nothing to watch.
      if (state.value !== PresenceState.Leaving) return
      if (notAnimating()) {
        leavingWaitFramesRef.current += 1
        if (leavingWaitFramesRef.current >= MAX_WAIT_FRAMES) {
          log(
            debugLog,
            `[vyui-presence][usePresence] leaving timeout reached, loopId: ${loopId}, frames: ${leavingWaitFramesRef.current}`,
          )
          if (show.value) restartShow()
          else setPresenceState(PresenceState.Left)
          return
        }
      }
      else {
        leavingWaitFramesRef.current = 0
        if (Date.now() - startedAt >= MAX_STUCK_MS) {
          // End/cancel never arrived (web) — clear the wedged flags so the
          // next cycle starts clean, and force-resolve.
          log(
            debugLog,
            `[vyui-presence][usePresence] leaving STUCK cap reached, loopId: ${loopId} — forcing Left`,
          )
          isKFAnimating.current = false
          isTransitionAnimating.current = false
          if (show.value) restartShow()
          else setPresenceState(PresenceState.Left)
          return
        }
      }
      delayFrames(1, tryLeft)
    }
    delayFrames(1, tryLeft)
  }

  const handleStateEnteringWithDelay = () => {
    leavingLoopIdRef.current += 1 // cancel any pending leaving wait
    enteringWaitFramesRef.current = 0
    enteringLoopIdRef.current += 1
    const loopId = enteringLoopIdRef.current
    const startedAt = Date.now()
    log(
      debugLog,
      `[vyui-presence][usePresence] entering loop scheduled, loopId: ${loopId}`,
    )
    const tryEntered = () => {
      if (loopId !== enteringLoopIdRef.current) return
      if (state.value !== getEnteringStateWithDelay()) return
      if (notAnimating()) {
        enteringWaitFramesRef.current += 1
        if (enteringWaitFramesRef.current >= MAX_WAIT_FRAMES) {
          log(
            debugLog,
            `[vyui-presence][usePresence] entering timeout reached, loopId: ${loopId}, frames: ${enteringWaitFramesRef.current}`,
          )
          if (show.value) setPresenceState(PresenceState.Entered)
          else setPresenceState(PresenceState.Leaving)
          return
        }
      }
      else {
        enteringWaitFramesRef.current = 0
        if (Date.now() - startedAt >= MAX_STUCK_MS) {
          log(
            debugLog,
            `[vyui-presence][usePresence] entering STUCK cap reached, loopId: ${loopId} — forcing Entered`,
          )
          isKFAnimating.current = false
          isTransitionAnimating.current = false
          if (show.value) setPresenceState(PresenceState.Entered)
          else setPresenceState(PresenceState.Leaving)
          return
        }
      }
      delayFrames(1, tryEntered)
    }
    delayFrames(1, tryEntered)
  }

  // ----- show/dismiss -------------------------------------------------------

  const handleShow = (scheduleId: number) => {
    log(debugLog, '[vyui-presence][usePresence] set mount=true')
    mount.value = true
    log(
      debugLog,
      '[vyui-presence][usePresence] schedule set Entering in 8 frames',
    )
    delayFrames(8, () => {
      if (scheduleId !== showScheduleIdRef.current || !show.value) return
      setPresenceState(PresenceState.Entering)
    })
    if (getEnableDelay()) {
      log(
        debugLog,
        '[vyui-presence][usePresence] schedule set DelayedEntering in 16 frames',
      )
      delayFrames(16, () => {
        if (scheduleId !== showScheduleIdRef.current || !show.value) return
        setPresenceState(PresenceState.DelayedEntering)
      })
    }
  }

  // Invalidate any pending show schedule and start a fresh one — the
  // re-entry path for "show flipped back on while leaving" (upstream parity).
  function restartShow() {
    showScheduleIdRef.current += 1
    handleShow(showScheduleIdRef.current)
  }

  const handleDismiss = () => {
    const s = state.value
    if (
      s === PresenceState.Entered
      || s === PresenceState.Entering
      || s === PresenceState.DelayedEntering
    ) {
      log(
        debugLog,
        '[vyui-presence][usePresence] show=false -> set PresenceState.Leaving',
      )
      enteringLoopIdRef.current += 1 // cancel any pending entering wait
      setPresenceState(PresenceState.Leaving)
    }
    else if (
      (s === PresenceState.Initial || s === PresenceState.Left)
      && mount.value
    ) {
      // show flipped back to false before the entering schedule fired —
      // there's nothing to animate out of, so unmount synchronously.
      // (The bumped showScheduleIdRef in the show watcher invalidates the
      // pending entering schedule so we don't race ourselves into a re-mount.)
      log(
        debugLog,
        `[vyui-presence][usePresence] show=false in ${s === PresenceState.Initial ? 'Initial' : 'Left'} -> set mount=false`,
      )
      mount.value = false
    }
  }

  // ----- watchers (React effects in Vue idiom) -----------------------------

  // useEffect([state]) — drive side effects off state transitions.
  watch(
    state,
    (s) => {
      log(
        debugLog,
        `[vyui-presence][usePresence] state effect, state: ${s}, show: ${show.value}, enableDelay: ${getEnableDelay()}, isTransitionAnimating: ${isTransitionAnimating.current}, isKFAnimating: ${isKFAnimating.current}`,
      )
      if (s === PresenceState.Entered) handleStateEntered()
      if (s === PresenceState.Left) handleStateLeft()
      if (s === PresenceState.Leaving) handleStateLeaving()
      if (s === getEnteringStateWithDelay()) handleStateEnteringWithDelay()
    },
    { immediate: true, flush: 'sync' },
  )

  // useEffect([show, enableDelay]) — react to the consumer flipping show.
  // `immediate: false` skips the initial-mount fire so the React semantics
  // (effects run AFTER the first render) are preserved.
  watch(
    enableDelay ? [show, enableDelay] : [show],
    () => {
      log(
        debugLog,
        `[vyui-presence][usePresence] show effect show:${show.value}, enableDelay:${getEnableDelay()}, state:${state.value}, mount:${mount.value}`,
      )
      showScheduleIdRef.current += 1
      const scheduleId = showScheduleIdRef.current
      if (show.value) handleShow(scheduleId)
      else handleDismiss()
    },
    { immediate: false, flush: 'sync' },
  )

  // Drive the initial show on mount (the React variant gets this from the
  // first effect pass; in Vue we run it once explicitly so we match the
  // `immediate: false` choice above).
  onMounted(() => {
    showScheduleIdRef.current += 1
    const scheduleId = showScheduleIdRef.current
    if (show.value) handleShow(scheduleId)
    else handleDismiss()
    isInitialRender.current = false
  })

  const ctx: PresenceContextType = {
    controllers: {
      state,
      mount,
      setPresenceState,
    },
    animationHandlers: {
      handleKFStart,
      handleKFCancel,
      handleKFEnd,
      handleTransitionStart,
      handleTransitionCancel,
      handleTransitionEnd,
    },
  }
  return ctx
}
