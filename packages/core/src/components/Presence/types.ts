// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-presence/src/types`.

import type {
  AnimationEvent,
  TransitionEvent,
} from '@lynx-js/types'
import type { Ref } from 'vue'

import type { PresenceState } from './utils'

/**
 * Public boolean flags derived from the internal {@link PresenceState}. Bound
 * to the default slot of `<Presence>` as `status` so callers can drive CSS
 * (`ui-entering` etc.) and/or inline animation logic.
 */
export interface PresenceAnimationStatus {
  /** The element is conceptually open (entering or fully entered). */
  open?: boolean
  /** The element is conceptually closed (leaving or fully left). */
  closed?: boolean
  /** The element is performing the leaving animation. Transition only. */
  leaving?: boolean
  /** The element is performing the entering animation. Transition only. */
  entering?: boolean
  /** The element is performing some animation. Transition only. */
  animating?: boolean
}

/**
 * UI variants emitted on Presence-managed elements. Use them as CSS selectors:
 *
 *   `.ui-open { ... }`, `.ui-closed { ... }`, `.ui-entering { ... }`,
 *   `.ui-leaving { ... }`, `.ui-animating { ... }`.
 */
export interface PresenceUiVariants {
  'ui-open'?: boolean
  'ui-closed'?: boolean
  'ui-entering'?: boolean
  'ui-leaving'?: boolean
  'ui-animating'?: boolean
}

/**
 * The default slot of `<Presence>` accepts either a static node or a render
 * function that receives the resolved animation status.
 *
 * Vue templates use `v-slot="{ status, present }"`; this type is mainly here
 * to keep the public surface aligned with the lynx-ui counterpart.
 */
export type PresenceChildrenType = (
  status: PresenceAnimationStatus,
) => unknown

export interface PresenceProps {
  /**
   * Drives the lifecycle. `true` triggers Entering → Entered (with the
   * optional `DelayedEntering` half-step), `false` triggers Leaving → Left.
   */
  show: boolean
  /** Keep the child mounted regardless of `show`. */
  forceMount?: boolean
  /** Controlled state — pair with {@link setPresenceState}. */
  state?: PresenceState
  /** Controlled state setter — pair with {@link state}. */
  setPresenceState?: (state: PresenceState) => void
  /**
   * Insert a `DelayedEntering` half-step before the entering animation. Lets
   * the layout settle before the showAnimation kicks in, which avoids initial
   * flicker for elements whose start frame depends on measured layout.
   */
  enableDelay?: boolean
  /** Fires once the element has fully entered. */
  onOpen?: () => void
  /** Fires once the element has fully left. */
  onClose?: () => void
  /** Enable verbose `console.info` lifecycle tracing. */
  debugLog?: boolean
}

/**
 * Same shape as {@link PresenceProps} but `state` and `setPresenceState` are
 * required — `usePresence` itself doesn't carry uncontrolled-fallback logic;
 * the `Presence` component / a parent `usePresenceGroup` provides that.
 */
export interface UsePresenceOptions {
  show: boolean
  forceMount?: boolean
  state: PresenceState
  setPresenceState: (state: PresenceState) => void
  enableDelay?: boolean
  onOpen?: () => void
  onClose?: () => void
  debugLog?: boolean
}

/**
 * The provide/inject payload that `<Presence>` exposes to descendants.
 * Phase-2 consumers (DialogContent, DialogBackdrop, SheetContent, ...) inject
 * this to read `controllers.state` for CSS class generation and to wire the
 * `animationHandlers` to their root `<view>` bindings.
 */
export interface PresenceContextType {
  controllers: {
    state: Ref<PresenceState>
    mount: Ref<boolean>
    setPresenceState: (state: PresenceState) => void
  }
  // Plain callables — Lynx binds these to `bindanimation*` / `bindtransition*`
  // event slots on the consumer's root `<view>`. The event payload is unused
  // by the state machine (we only care about which phase ended), so the
  // signature accepts an optional `AnimationEvent` / `TransitionEvent` for
  // ergonomic type-checking at the binding site.
  animationHandlers: {
    handleKFStart: (event?: AnimationEvent) => void
    handleKFCancel: (event?: AnimationEvent) => void
    handleKFEnd: (event?: AnimationEvent) => void
    handleTransitionStart: (event?: TransitionEvent) => void
    handleTransitionCancel: (event?: TransitionEvent) => void
    handleTransitionEnd: (event?: TransitionEvent) => void
  }
}

export type UsePresenceReturnType = PresenceContextType
