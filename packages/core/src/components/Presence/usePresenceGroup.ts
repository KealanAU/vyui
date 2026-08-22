// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui`
// `packages/lynx-ui-presence/src/usePresenceGroup.tsx`.
//
// Coordinates a group of `<Presence>` children: the group-level `onOpen` /
// `onClose` fire only once *all* members finish their animations, and a single
// combined `mountView` flag gates the outer container. Each `children` entry
// becomes the `default` slot of one inner `<Presence>` — pass VNodes or render
// functions that accept the {@link PresenceAnimationStatus} payload.

import type { Ref, VNode } from 'vue'
import { computed, h, ref, watch } from 'vue'

import type {
  PresenceAnimationStatus,
} from './types'
import Presence from './Presence'
import { PresenceState } from './utils'

export type PresenceGroupChild =
  | VNode
  | VNode[]
  | ((status: PresenceAnimationStatus) => VNode | VNode[] | null | undefined)

export interface UsePresenceGroupOptions {
  /** Drives the group lifecycle — pass the live `Ref` from the parent. */
  show: Ref<boolean>
  /** Optional callback that receives the combined group state on every tick. */
  setGroupState?: (state: PresenceState) => void
  /** Enables the entering-with-delay half-step for every child. */
  enableDelay?: Ref<boolean>
  /** Children to wrap — each entry mounts inside its own `<Presence>`. */
  children: PresenceGroupChild[]
  /** Fires once every child has entered. */
  onOpen?: () => void
  /** Fires once every child has left. */
  onClose?: () => void
  /** Verbose lifecycle tracing — forwarded to each child Presence. */
  debugLog?: boolean
}

export interface UsePresenceGroupReturn {
  /** Function that produces the wrapped children VNodes for the parent's template. */
  renderChildren: () => VNode[]
  /** Whether the parent container should be mounted. Stays true until every
   *  child has settled in {@link PresenceState.Left}. */
  mountView: Ref<boolean>
}

/**
 * Combine member states into the group's state. Exported for overlays that
 * coordinate their layers with manually-controlled `<Presence>` wrappers
 * instead of `usePresenceGroup`'s render path.
 */
export function combineGroupState(states: PresenceState[]): PresenceState {
  // `DelayedEntering` wins over `Entering` so the parent can keep
  // `enableDelay`'d members in their layout-settle phase.
  if (states.some(s => s === PresenceState.DelayedEntering)) {
    return PresenceState.DelayedEntering
  }
  if (states.some(s => s === PresenceState.Entering)) {
    return PresenceState.Entering
  }
  if (states.some(s => s === PresenceState.Leaving)) {
    return PresenceState.Leaving
  }
  if (states.every(s => s === PresenceState.Entered)) {
    return PresenceState.Entered
  }
  if (states.every(s => s === PresenceState.Left)) {
    return PresenceState.Left
  }
  return PresenceState.Left
}

/**
 * Wrap a group of nodes in coordinated `<Presence>` wrappers — the group-level
 * `onOpen` / `onClose` fire only after every child has finished its animation.
 *
 * `renderChildren` is a function rather than the React version's memoised node:
 * call it inside the parent `setup`'s return function (or via `<component :is>`).
 */
export const usePresenceGroup = (
  opts: UsePresenceGroupOptions,
): UsePresenceGroupReturn => {
  const {
    show,
    enableDelay,
    children,
    setGroupState,
    onOpen,
    onClose,
    debugLog,
  } = opts

  const childrenSize = children.length
  const mountedCount = ref<number>(0)
  const mountView = ref<boolean>(show.value)

  // Controlled state lets the group inspect every member's transition without
  // subscribing through inject.
  const stateGroup = ref<PresenceState[]>(
    Array.from({ length: childrenSize }, () => PresenceState.Left),
  )

  const updateChildState = (index: number, next: PresenceState) => {
    const copy = stateGroup.value.slice()
    copy[index] = next
    stateGroup.value = copy
    if (setGroupState) {
      setGroupState(combineGroupState(copy))
    }
  }

  const handleChildOpen = () => {
    mountedCount.value += 1
    if (mountedCount.value === childrenSize && childrenSize > 0) {
      onOpen?.()
    }
  }

  const handleChildClose = () => {
    mountedCount.value -= 1
    if (mountedCount.value <= 0) {
      mountedCount.value = 0
      onClose?.()
      mountView.value = false
    }
  }

  // Mirror lynx-ui: re-mount the outer view as soon as `show` flips back to
  // true, even if some children are still mid-leaving.
  watch(show, (next) => {
    if (next) mountView.value = true
  })

  const presenceShows = computed<boolean[]>(() =>
    Array.from({ length: childrenSize }, () => show.value),
  )

  const renderChildren = (): VNode[] => {
    return children.map((child, index) => {
      const slot = () => {
        if (typeof child === 'function') {
          const out = child(
            // The function-style child gets a permissive empty status — there
            // is no clean ref to the inner Presence's resolved status here.
            {},
          )
          if (!out) return []
          return Array.isArray(out) ? out : [out]
        }
        return Array.isArray(child) ? child : [child]
      }
      return h(
        Presence,
        {
          show: presenceShows.value[index],
          state: stateGroup.value[index],
          setPresenceState: (s: PresenceState) => updateChildState(index, s),
          enableDelay: enableDelay?.value ?? false,
          onOpen: handleChildOpen,
          onClose: handleChildClose,
          debugLog,
        },
        { default: slot },
      )
    })
  }

  return {
    renderChildren,
    mountView,
  }
}
