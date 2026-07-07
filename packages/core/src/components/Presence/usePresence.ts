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
 * Hard ceiling on the TOTAL number of frames an element may sit in `Leaving`,
 * regardless of animation events. 60 frames ≈ 1s at 60fps — comfortably past
 * any exit animation (280ms default) plus the {@link MAX_WAIT_FRAMES} grace.
 *
 * The per-frame fallback in `handleStateLeaving` is cancelled by ANY
 * `bindanimationstart` / `bindtransitionstart`, after which the machine
 * trusts a matching end/cancel to arrive. On Lynx that trust can be broken:
 * a BG re-render that patches styles replaces main-thread-written inline
 * styles wholesale (vue-lynx SET_STYLE), which can kill a running animation
 * without ever firing its end/cancel — the state hangs in `Leaving` and the
 * invisible child keeps eating taps. This cap is the un-cancellable safety
 * net: once it expires, `Left` is forced no matter what.
 */
export const MAX_LEAVING_FRAMES = 60

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
 * hang on screen. `Leaving` additionally carries the un-cancellable
 * {@link MAX_LEAVING_FRAMES} hard cap, which forces `Left` even when a start
 * event arrived but its end/cancel never will.
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
  // Always-fresh mirror of `show.value` so event handlers can branch on the
  // most recent intent without re-running the composable body.
  const showRef = { current: show.value }
  watch(show, (next) => {
    showRef.current = next
  }, { flush: 'sync' })

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
  // Separate id for the hard-cap loop: bumped ONLY on (re)entry into Leaving,
  // never by animation start events — that's what makes it un-cancellable.
  const leavingHardLoopIdRef = { current: 0 }
  const leavingHardWaitFramesRef = { current: 0 }

  // ----- helpers ------------------------------------------------------------

  const notAnimating = () =>
    isKFAnimating.current === false && isTransitionAnimating.current === false

  const handleAnimationStart = () => {
    log(
      debugLog,
      `[vyui-presence][usePresence] handleAnimationStart state:${state.value}, show:${showRef.current}, isTransition:${isTransitionAnimating.current}, isKFAnimating:${isKFAnimating.current}`,
    )
  }

  const handleAnimationEnd = () => {
    const s = state.value
    // Still need to check if the other kind of animation is running.
    if (
      (s === PresenceState.Entering || s === PresenceState.DelayedEntering)
      && notAnimating()
    ) {
      if (showRef.current) {
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
      setPresenceState(PresenceState.Left)
    }
  }

  // ----- animation event handlers ------------------------------------------
  // Plain callables — Lynx binds these as the `bindanimation*` /
  // `bindtransition*` listeners on the consumer's root `<view>`.

  const handleKFStart = () => {
    isKFAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
    log(
      debugLog,
      `[vyui-presence][usePresence] KF start, loopId: ${leavingLoopIdRef.current}`,
    )
    handleAnimationStart()
  }

  const handleTransitionStart = () => {
    isTransitionAnimating.current = true
    enteringLoopIdRef.current += 1
    leavingLoopIdRef.current += 1
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
    onOpen?.()
  }

  const handleStateLeft = () => {
    if (!isInitialRender.current) {
      onClose?.()
    }
    log(debugLog, '[vyui-presence][usePresence] set mount=false (Left)')
    mount.value = false
  }

  const handleStateLeaving = () => {
    leavingWaitFramesRef.current = 0
    leavingLoopIdRef.current += 1
    const loopId = leavingLoopIdRef.current
    log(
      debugLog,
      `[vyui-presence][usePresence] leaving loop scheduled, loopId: ${loopId}`,
    )
    const tryLeft = () => {
      // loopId mismatch ⇒ an animation started during the delay; abandon.
      if (loopId !== leavingLoopIdRef.current) return
      if (!notAnimating()) return
      if (leavingWaitFramesRef.current >= MAX_WAIT_FRAMES) {
        log(
          debugLog,
          `[vyui-presence][usePresence] leaving timeout reached, loopId: ${loopId}, frames: ${leavingWaitFramesRef.current}`,
        )
        setPresenceState(PresenceState.Left)
        return
      }
      leavingWaitFramesRef.current += 1
      delayFrames(1, tryLeft)
    }
    delayFrames(1, tryLeft)

    // Un-cancellable hard cap — see MAX_LEAVING_FRAMES. Unlike `tryLeft`,
    // this loop ignores `leavingLoopIdRef` bumps and the animating flags; it
    // only stands down when the state itself moved on (an animation end
    // advanced to Left) or the consumer flipped `show` back to true (the
    // re-entry path owns the element again).
    leavingHardWaitFramesRef.current = 0
    leavingHardLoopIdRef.current += 1
    const hardLoopId = leavingHardLoopIdRef.current
    const forceLeft = () => {
      if (hardLoopId !== leavingHardLoopIdRef.current) return
      if (state.value !== PresenceState.Leaving) return
      if (showRef.current) return
      if (leavingHardWaitFramesRef.current >= MAX_LEAVING_FRAMES) {
        log(
          debugLog,
          `[vyui-presence][usePresence] leaving hard cap reached, force Left, loopId: ${hardLoopId}`,
        )
        // An animation start whose end/cancel never arrived leaves these
        // stuck true — clear them so the next open/close cycle isn't poisoned.
        isKFAnimating.current = false
        isTransitionAnimating.current = false
        setPresenceState(PresenceState.Left)
        return
      }
      leavingHardWaitFramesRef.current += 1
      delayFrames(1, forceLeft)
    }
    delayFrames(1, forceLeft)
  }

  const handleStateEnteringWithDelay = () => {
    enteringWaitFramesRef.current = 0
    enteringLoopIdRef.current += 1
    const loopId = enteringLoopIdRef.current
    log(
      debugLog,
      `[vyui-presence][usePresence] entering loop scheduled, loopId: ${loopId}`,
    )
    const tryEntered = () => {
      if (loopId !== enteringLoopIdRef.current) return
      if (!notAnimating()) return
      if (enteringWaitFramesRef.current >= MAX_WAIT_FRAMES) {
        log(
          debugLog,
          `[vyui-presence][usePresence] entering timeout reached, loopId: ${loopId}, frames: ${enteringWaitFramesRef.current}`,
        )
        setPresenceState(PresenceState.Entered)
        return
      }
      enteringWaitFramesRef.current += 1
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
      if (scheduleId !== showScheduleIdRef.current) return
      setPresenceState(PresenceState.Entering)
    })
    if (getEnableDelay()) {
      log(
        debugLog,
        '[vyui-presence][usePresence] schedule set DelayedEntering in 16 frames',
      )
      delayFrames(16, () => {
        if (scheduleId !== showScheduleIdRef.current) return
        setPresenceState(PresenceState.DelayedEntering)
      })
    }
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
        `[vyui-presence][usePresence] state effect, state: ${s}, show: ${showRef.current}, enableDelay: ${getEnableDelay()}, isTransitionAnimating: ${isTransitionAnimating.current}, isKFAnimating: ${isKFAnimating.current}`,
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
