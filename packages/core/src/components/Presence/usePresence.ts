// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported 1:1 from `lynx-family/lynx-ui`
// `packages/lynx-ui-presence/src/usePresence.tsx`. Upstream's showRef/stateRef
// mirrors are dropped: `show` and `state` are Vue `Ref`s here, so `.value` is
// always live. The composable is invoked once per Presence instance in
// `setup()`; reactive inputs are passed as `Ref`s so the watches fire.

import type { Ref } from 'vue'
import { onMounted, ref, watch } from 'vue'

import { delayFrames, log } from '@/shared'
import type {
  PresenceContextType,
  UsePresenceReturnType,
} from './types'
import { PresenceState } from './utils'

/** Reactive options accepted by {@link usePresence} — each driving field is a
 *  `Ref` so the composable can `watch` it. */
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
 * Frames `handleStateEntering`/`handleStateLeaving` wait for a real
 * `bindanimationstart` / `bindtransitionstart` before force-progressing the
 * state machine. 24 frames ≈ 400ms at 60fps.
 */
export const MAX_WAIT_FRAMES = 24

/**
 * Absolute wall-clock ceiling on how long Entering/Leaving may stay unresolved
 * while an animation is (or claims to be) in flight. On web, end/cancel events
 * can be lost outright — a child unmounted mid-transition never delivers its
 * end — which wedges the machine forever (a stuck Leaving keeps the invisible
 * backdrop mounted, eating every tap under it). Wall-clock, not frames: rAF
 * cadence varies wildly across environments. Not in upstream lynx-ui.
 */
export const MAX_STUCK_MS = 3000

/**
 * The core animation state machine for `<Presence>`.
 *
 * Listens to `bindanimation{start,end,cancel}` and the corresponding
 * `bindtransition*` events (Lynx fires these natively on `<view>`). When one
 * resolves and no other animation is in flight, the state advances:
 * Entering / DelayedEntering → Entered, Leaving → Left. If nothing fires for
 * {@link MAX_WAIT_FRAMES}, it advances anyway so unanimated content doesn't
 * hang on screen.
 *
 * Race protection — `enteringLoopIdRef` / `leavingLoopIdRef` /
 * `showScheduleIdRef` are incremented on every relevant trigger; in-flight
 * `delayFrames` callbacks bail when their captured id is stale.
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

  const trace = (msg: string) => log(debugLog, `[vyui-presence][usePresence] ${msg}`)

  trace(`init, show: ${show.value}, state: ${state.value}, enableDelay: ${getEnableDelay()}`)

  // Mutable, non-reactive refs — `useRef` analogue. Written during event
  // handlers, and must never trigger a re-render.
  const isTransitionAnimating = { current: false }
  const isKFAnimating = { current: false }
  // Tracks the very first render so onClose doesn't fire when the component
  // first mounts in the terminal Left state.
  const isInitialRender = { current: true }
  // Dedupes open/close notifications across re-entries — a reopen-during-close
  // routes back through Entered without ever reaching Left (upstream parity).
  const hasNotifiedOpen = { current: false }

  const mount = ref<boolean>(false)

  // Loop-id refs guard against stale `delayFrames` callbacks racing the current
  // animation cycle.
  const enteringLoopIdRef = { current: 0 }
  const leavingLoopIdRef = { current: 0 }
  const showScheduleIdRef = { current: 0 }


  const notAnimating = () =>
    isKFAnimating.current === false && isTransitionAnimating.current === false

  const handleAnimationStart = () => {
    trace(`handleAnimationStart state:${state.value}, show:${show.value}, isTransition:${isTransitionAnimating.current}, isKFAnimating:${isKFAnimating.current}`)
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
  //
  // These deliberately do NOT bump the entering/leaving loop ids (upstream
  // lynx-ui does): bumping killed the frame watchdog the moment any animation
  // started, leaving the machine trusting an end/cancel event web can lose —
  // see {@link MAX_STUCK_MS}.
  const handleKFStart = () => {
    isKFAnimating.current = true
    trace(`KF start, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationStart()
  }

  const handleTransitionStart = () => {
    isTransitionAnimating.current = true
    trace(`Transition start, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationStart()
  }

  const handleKFEnd = () => {
    isKFAnimating.current = false
    trace(`KF end, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationEnd()
  }

  const handleKFCancel = () => {
    isKFAnimating.current = false
    trace(`KF cancel, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationEnd()
  }

  const handleTransitionCancel = () => {
    isTransitionAnimating.current = false
    trace(`Transition cancel, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationEnd()
  }

  const handleTransitionEnd = () => {
    isTransitionAnimating.current = false
    trace(`Transition end, loopId: ${leavingLoopIdRef.current}`)
    handleAnimationEnd()
  }


  const handleStateEntered = () => {
    if (hasNotifiedOpen.current) return
    hasNotifiedOpen.current = true
    onOpen?.()
  }

  const handleStateLeft = () => {
    if (show.value) {
      // show flipped back on while we were leaving — remount instead of
      // tearing down. Without this a reopen that races Leaving → Left strands
      // show=true with nothing mounted and the trigger goes permanently dead.
      trace('skip mount=false because show=true (Left)')
      restartShow()
      return
    }
    if (!isInitialRender.current && hasNotifiedOpen.current) {
      hasNotifiedOpen.current = false
      onClose?.()
    }
    trace('set mount=false (Left)')
    mount.value = false
  }

  /**
   * Polls once per frame until `state` leaves `isCurrentState()`. Two ways out
   * other than the normal end event: no animation ever starts (resolve after
   * {@link MAX_WAIT_FRAMES}), or one starts but its end/cancel is lost (resolve
   * after {@link MAX_STUCK_MS}, clearing the wedged flags first). Stale ticks
   * self-terminate on the loop id.
   */
  const watchdog = (
    name: string,
    loopIdRef: { current: number },
    isCurrentState: () => boolean,
    resolve: () => void,
  ) => {
    loopIdRef.current += 1
    const loopId = loopIdRef.current
    const startedAt = Date.now()
    let idleFrames = 0
    trace(`${name} loop scheduled, loopId: ${loopId}`)
    const tick = () => {
      if (loopId !== loopIdRef.current) return // a newer cycle superseded this
      if (!isCurrentState()) return // resolved through the end-event path
      if (notAnimating()) {
        if (++idleFrames >= MAX_WAIT_FRAMES) {
          trace(`${name} timeout reached, loopId: ${loopId}, frames: ${idleFrames}`)
          return resolve()
        }
      }
      else {
        idleFrames = 0
        if (Date.now() - startedAt >= MAX_STUCK_MS) {
          trace(`${name} STUCK cap reached, loopId: ${loopId} — forcing resolution`)
          isKFAnimating.current = false
          isTransitionAnimating.current = false
          return resolve()
        }
      }
      delayFrames(1, tick)
    }
    delayFrames(1, tick)
  }

  const handleStateLeaving = () => {
    enteringLoopIdRef.current += 1 // cancel any pending entering wait
    watchdog(
      'leaving',
      leavingLoopIdRef,
      () => state.value === PresenceState.Leaving,
      () => show.value ? restartShow() : setPresenceState(PresenceState.Left),
    )
  }

  const handleStateEnteringWithDelay = () => {
    leavingLoopIdRef.current += 1 // cancel any pending leaving wait
    watchdog(
      'entering',
      enteringLoopIdRef,
      () => state.value === getEnteringStateWithDelay(),
      () => setPresenceState(
        show.value ? PresenceState.Entered : PresenceState.Leaving,
      ),
    )
  }


  const handleShow = (scheduleId: number) => {
    trace('set mount=true')
    mount.value = true
    trace('schedule set Entering in 8 frames')
    delayFrames(8, () => {
      if (scheduleId !== showScheduleIdRef.current || !show.value) return
      setPresenceState(PresenceState.Entering)
    })
    if (getEnableDelay()) {
      trace('schedule set DelayedEntering in 16 frames')
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
    if (s === getEnteringStateWithDelay()) {
      // Mid-enter. Do NOT cut straight to Leaving: a leave keyframe starts from
      // the element's UNDERLYING value, not from wherever the enter animation
      // currently has it, so swapping mid-flight snaps the element to fully open
      // and plays the exit from there. Let the enter finish —
      // `handleAnimationEnd` routes Entering → Leaving on its own because `show`
      // is already false, and the entering watchdog does the same if no
      // animation fires or its end event is lost.
      trace('show=false mid-enter -> defer Leaving until the enter resolves')
      return
    }
    if (
      s === PresenceState.Entered
      || s === PresenceState.Entering
      || s === PresenceState.DelayedEntering
    ) {
      trace('show=false -> set PresenceState.Leaving')
      enteringLoopIdRef.current += 1 // cancel any pending entering wait
      setPresenceState(PresenceState.Leaving)
    }
    else if (
      (s === PresenceState.Initial || s === PresenceState.Left)
      && mount.value
    ) {
      // show flipped back to false before the entering schedule fired — nothing
      // to animate out of, so unmount synchronously.
      trace(`show=false in ${s === PresenceState.Initial ? 'Initial' : 'Left'} -> set mount=false`)
      mount.value = false
    }
  }


  // useEffect([state]) — drive side effects off state transitions.
  watch(
    state,
    (s) => {
      trace(`state effect, state: ${s}, show: ${show.value}, enableDelay: ${getEnableDelay()}, isTransitionAnimating: ${isTransitionAnimating.current}, isKFAnimating: ${isKFAnimating.current}`)
      if (s === PresenceState.Entered) handleStateEntered()
      if (s === PresenceState.Left) handleStateLeft()
      if (s === PresenceState.Leaving) handleStateLeaving()
      if (s === getEnteringStateWithDelay()) handleStateEnteringWithDelay()
    },
    { immediate: true, flush: 'sync' },
  )

  // useEffect([show, enableDelay]). `immediate: false` skips the initial-mount
  // fire so effects run AFTER the first render, as in React.
  watch(
    enableDelay ? [show, enableDelay] : [show],
    () => {
      trace(`show effect show:${show.value}, enableDelay:${getEnableDelay()}, state:${state.value}, mount:${mount.value}`)
      showScheduleIdRef.current += 1
      const scheduleId = showScheduleIdRef.current
      if (show.value) handleShow(scheduleId)
      else handleDismiss()
    },
    { immediate: false, flush: 'sync' },
  )

  // Drive the initial show on mount — run once explicitly to match the
  // `immediate: false` choice above.
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
