// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.
//
// useMtSpring — a minimal main-thread spring animator.
//
// This is the piece `@lynx-js/motion` gives lynx-ui (Sheet, etc.) for free —
// but motion has a hard `@lynx-js/react` peer dep, so it can't run under
// vue-lynx. We rebuild only what we need: a mass-spring-damper stepped on the
// MAIN thread via `requestAnimationFrame`, writing `transform`/`opacity` each
// frame with `setStyleProperty`.
//
// Why MT + transform (and NOT a CSS width/height transition):
//   - `transform`/`opacity` are compositor properties — animating them never
//     triggers layout/reflow, so the spring stays smooth. CSS transitions
//     can't animate content/auto-driven `width`/`height` at all (the engine
//     refuses to reflow per frame), which is why the size-morph never moved.
//   - Running the loop on the MAIN thread keeps each frame on the UI thread
//     with no background↔UI hop — the same reason lynx-ui drives motion on MT.
//
// vue-lynx@0.4.0 ordering note: the MT-rAF approach is only unsafe when
// `runOnMainThread(worklet)()` is dispatched DURING setup, before the
// `INIT_MT_REF` ops flush. `enter()` is always called from an interaction /
// post-mount watcher, long after refs register, so it's safe here (mirrors how
// SheetContentImpl drives its MT worklets from touch handlers).
//
// The spring math is the unit-tested `springStep` / `isSpringSettled` spec in
// `shared/gesture/physics.ts`. It is INLINED below rather than imported: the
// vue-lynx worklet transform builds each `'main thread'` function standalone
// and does not reliably resolve calls out to other module-level worklets
// (every drag component inlines its physics the same way).

import { runOnMainThread, useMainThreadRef } from 'vue-lynx'
import { SPRING_DEFAULT } from '../gesture/physics'

export interface MtSpringConfig {
  /** Spring constant — higher = snappier. @defaultValue `220` */
  stiffness?: number
  /** Damping — higher = less overshoot/oscillation. @defaultValue `26` */
  damping?: number
  /** Mass — higher = heavier/slower. @defaultValue `1` */
  mass?: number
}

/**
 * Creates a main-thread spring controller bound to a single element.
 *
 * @returns
 *   - `elRef` — bind to a view via `:main-thread-ref="elRef"`.
 *   - `enter(offsetPx?, config?)` — spring the element in: `translateY` from
 *     `offsetPx` → 0 (sign chooses the direction it emerges from) with
 *     `opacity` 0 → 1. A reveal, driven by real spring physics.
 *   - `settle()` — jump straight to the resting state (used when animation is
 *     disabled, or to cancel an in-flight reveal).
 */
export function useMtSpring() {
  const elRef = useMainThreadRef<any>(null)

  // -- Main-thread worklets ------------------------------------------------

  function _enter(offsetPx: number, stiffness: number, damping: number, mass: number) {
    'main thread'
    const el = elRef.current
    if (!el || typeof el.setStyleProperty !== 'function') return

    // No MT frame scheduler (older runtime / jsdom) → land on the resting
    // state immediately rather than freezing mid-reveal.
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null
    if (!raf) {
      el.setStyleProperty('transform', 'translateY(0px)')
      el.setStyleProperty('opacity', '1')
      return
    }

    // Progress 0 → 1. `transform`/`opacity` are derived from it each frame.
    let value = 0
    let velocity = 0
    let lastT = -1

    el.setStyleProperty('transform', `translateY(${offsetPx}px)`)
    el.setStyleProperty('opacity', '0')

    function frame(ts?: number) {
      const t = typeof ts === 'number' ? ts : Date.now()
      // First frame: assume one 60fps tick. After that use the real delta,
      // clamped so a long-frame hitch can't make the integrator overshoot.
      const dt = lastT < 0 ? 1 / 60 : Math.min((t - lastT) / 1000, 1 / 30)
      lastT = t

      // Inlined `springStep` toward target = 1 (see physics.ts for the spec).
      const springForce = -stiffness * (value - 1)
      const dampingForce = -damping * velocity
      const accel = (springForce + dampingForce) / mass
      velocity = velocity + accel * dt
      value = value + velocity * dt

      // Inlined `isSpringSettled`.
      if (Math.abs(value - 1) < 0.01 && Math.abs(velocity) < 0.01) {
        el.setStyleProperty('transform', 'translateY(0px)')
        el.setStyleProperty('opacity', '1')
        return
      }

      const clamped = value < 0 ? 0 : value > 1 ? 1 : value
      el.setStyleProperty('transform', `translateY(${(1 - value) * offsetPx}px)`)
      el.setStyleProperty('opacity', `${clamped}`)
      raf!(frame)
    }

    raf(frame)
  }

  function _settle() {
    'main thread'
    const el = elRef.current
    if (!el || typeof el.setStyleProperty !== 'function') return
    el.setStyleProperty('transform', 'translateY(0px)')
    el.setStyleProperty('opacity', '1')
  }

  // DIAGNOSTIC: paints the bound element bright red with NO rAF and NO
  // animation — a pure "did the MT worklet run + can it mutate style + is the
  // ref live" probe. If the element turns red, the whole MT path works and the
  // only remaining suspect for the missing animation is `requestAnimationFrame`
  // in the worklet. Remove once the morph is confirmed.
  function _poke() {
    'main thread'
    const el = elRef.current
    if (!el || typeof el.setStyleProperty !== 'function') return
    el.setStyleProperty('background-color', '#ff0000')
    el.setStyleProperty('opacity', '0.5')
  }

  // -- Background-thread wrappers ------------------------------------------

  function enter(offsetPx = 12, config: MtSpringConfig = {}) {
    const stiffness = config.stiffness ?? SPRING_DEFAULT.stiffness
    const damping = config.damping ?? SPRING_DEFAULT.damping
    const mass = config.mass ?? SPRING_DEFAULT.mass
    runOnMainThread(_enter as any)(offsetPx, stiffness, damping, mass)
  }

  function settle() {
    runOnMainThread(_settle as any)()
  }

  /** DIAGNOSTIC — see `_poke`. */
  function poke() {
    runOnMainThread(_poke as any)()
  }

  return { elRef, enter, settle, poke }
}
