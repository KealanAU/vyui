// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-presence/src/utils.tsx`.

import type { PresenceAnimationStatus } from './types'

/**
 * The internal animation state machine for `Presence`.
 *
 * Values are stable integers so they can be compared cheaply and so the
 * numeric order roughly tracks the visual lifecycle (Initial → Entering →
 * Entered → Leaving → Left). `DelayedEntering` is a special intermediate
 * state used when `enableDelay` is set so layout settles before the
 * showAnimation starts.
 */
export enum PresenceState {
  Initial = 0,
  Entering = 1,
  /** Two-phase entering for `enableDelay`: layout first, animate next. */
  DelayedEntering = 2,
  Entered = 3,
  Leaving = 4,
  Left = 5,
}

/**
 * `true` while the Presence state machine is mid-animation (Entering /
 * DelayedEntering / Leaving). Consumers (Dialog/AlertDialog triggers + close
 * buttons, ActionSheet actions, ...) use it to swallow taps during a running
 * animation so a fast double-tap can't re-trigger the open/close sequence
 * before it finishes.
 *
 * Ported from `lynx-family/lynx-ui`
 * `packages/lynx-ui-dialog/src/DialogButton.tsx`.
 */
export function resolveBusyState(state: PresenceState): boolean {
  switch (state) {
    case PresenceState.Entering:
    case PresenceState.DelayedEntering:
    case PresenceState.Leaving:
      return true
    default:
      return false
  }
}

/**
 * Translate the internal {@link PresenceState} into the public boolean flags
 * (`open` / `closed` / `entering` / `leaving` / `animating`) consumers use to
 * drive their CSS / inline animations.
 *
 * `grouped: true` is for `usePresenceGroup` members — a group has to stay
 * `open` while any child is still leaving, and only flip `closed` once every
 * child has reached {@link PresenceState.Left}.
 */
export const resolveAnimationStatus: ({
  state,
  enableDelay,
  grouped,
}: {
  state: PresenceState
  enableDelay: boolean
  grouped?: boolean
}) => PresenceAnimationStatus = ({
  state,
  enableDelay,
  grouped = false,
}) => {
  const enteringStateWithDelay = enableDelay
    ? PresenceState.DelayedEntering
    : PresenceState.Entering
  const isOpen = state === enteringStateWithDelay
    || state === PresenceState.Entered
  const groupedOpen = isOpen || state === PresenceState.Leaving

  const isClose = state === PresenceState.Leaving
    || state === PresenceState.Left
    || (enableDelay && state === PresenceState.Entering)
  const groupedClosed = state === PresenceState.Left
  return {
    leaving: state === PresenceState.Leaving,
    entering: state === enteringStateWithDelay,
    animating: state === PresenceState.Leaving
      || state === enteringStateWithDelay,

    // Grouped open = entering / delayedEntering / entered / leaving.
    // Normal  open = entering / delayedEntering / entered.
    open: grouped ? groupedOpen : isOpen,
    // Grouped closed = left.
    // Normal  closed = leaving / left.
    closed: grouped ? groupedClosed : isClose,
  }
}

interface PresenceClassVariantsProps {
  state: PresenceState
  enableDelay: boolean
  className?: string
  transition?: boolean
  grouped?: boolean
}

/**
 * Tiny inline `clsx`-style helper — vyui doesn't pull `clsx` as a dep so we
 * build the class string in place. Accepts plain strings and `{ class: bool }`
 * maps; falsy/empty values are stripped.
 */
function cn(
  ...parts: Array<string | undefined | null | false | Record<string, unknown>>
): string {
  const out: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (typeof part === 'string') {
      out.push(part)
      continue
    }
    for (const key in part) {
      if (part[key]) out.push(key)
    }
  }
  return out.join(' ')
}

/**
 * Build the `class` string consumers should bind to their Presence-managed
 * element. Mirrors the lynx-ui contract:
 *
 *   - `ui-open`     — `status.open`
 *   - `ui-closed`   — `status.closed`
 *   - `ui-entering` — `status.entering`  (only with `transition: true`)
 *   - `ui-leaving`  — `status.leaving`   (only with `transition: true`)
 *   - `ui-animating`— `status.animating` (only with `transition: true`)
 *
 * Pass `transition: true` to opt the element into the full animating-state
 * classes; the default emits only the static `ui-open` / `ui-closed` pair.
 */
export const presenceClassVariants = ({
  state,
  enableDelay,
  className,
  transition,
  grouped,
}: PresenceClassVariantsProps) => {
  const status = resolveAnimationStatus({
    state,
    enableDelay,
    grouped,
  })
  if (transition) {
    return cn(
      className,
      {
        'ui-entering': !!status.entering,
        'ui-leaving': !!status.leaving,
        'ui-animating': !!status.animating,
        'ui-open': !!status.open,
        'ui-closed': !!status.closed,
      },
    )
  }
  return cn(className, {
    'ui-open': !!status.open,
    'ui-closed': !!status.closed,
  })
}
