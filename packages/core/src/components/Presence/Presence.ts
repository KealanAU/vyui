// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui`
// `packages/lynx-ui-presence/src/Presence.tsx`. Vue/Lynx specifics:
//
//   - `createContext` is replaced with provide/inject keyed by
//     {@link PresenceContextKey}.
//   - The optional `state` / `setPresenceState` props enable a controlled
//     mode (parent owns the state machine — used by `usePresenceGroup`); when
//     omitted the component manages an internal `ref<PresenceState>`.
//   - The render function preserves the v1 contract: a single direct child
//     VNode, plus the `present` slot prop name for back-compat with Dialog /
//     AlertDialog / Sheet (those are migrated in Phase 2). New surface:
//     `status` (PresenceAnimationStatus) and the `state` enum.
//
// This file deliberately uses `defineComponent` (not `<script setup>`) so the
// render function can throw the same "invalid children" error v1 did, and so
// we can `provide` the inject key from a single setup pass.

import type { InjectionKey, PropType, SlotsType, VNode } from 'vue'
import {
  computed,
  defineComponent,
  getCurrentInstance,
  provide,
  ref,
  toRef,
} from 'vue'

import { renderSlotFragments } from '@/shared'
import type {
  PresenceAnimationStatus,
  PresenceContextType,
} from './types'
import { usePresence } from './usePresence'
import { PresenceState, resolveAnimationStatus } from './utils'

/**
 * Vue `provide` key for the {@link PresenceContextType} payload that
 * `<Presence>` exposes to descendants. Phase-2 consumers (DialogContent,
 * DialogBackdrop, SheetContent, ...) `inject(PresenceContextKey)` to read
 * `controllers.state` for class generation and to wire `animationHandlers`
 * to their root `<view>` bindings.
 *
 * Registered through `Symbol.for(...)` so dual-`<script>` SFCs that get
 * loaded twice (rspack-vue-loader + builtin:swc-loader) still resolve to
 * the same injection key. See `shared/createContext.ts` for the rationale.
 */
export const PresenceContextKey: InjectionKey<PresenceContextType>
  = Symbol.for('vyui:PresenceContext')

/**
 * Public props for `<Presence>`. `show` is the lynx-ui-style input; `present`
 * is kept as a back-compat alias because Phase-1 consumers (Dialog, Sheet,
 * Popover, Checkbox, etc.) still pass it. Phase 2 migrates them to `show`.
 */
export interface PresenceProps {
  /**
   * Drives the lifecycle. `true` runs Entering → Entered (or
   * DelayedEntering → Entering → Entered with `enable-delay`); `false` runs
   * Leaving → Left.
   */
  show?: boolean
  /**
   * Back-compat alias for {@link show}. When both are supplied, `show` wins.
   * @deprecated Pass `show` instead — `present` is kept for the v1 consumers
   *   that haven't migrated yet.
   */
  present?: boolean
  /**
   * Force the element to render regardless of `show`. Useful when the caller
   * drives mount/unmount on its own and only wants Presence for the
   * lifecycle state.
   */
  forceMount?: boolean
  /**
   * Controlled state. When provided, `<Presence>` becomes a thin wrapper that
   * reads/writes through {@link setPresenceState} instead of owning its own
   * `state` ref.
   */
  state?: PresenceState
  /** Setter for the controlled {@link state}. Required when `state` is set. */
  setPresenceState?: (state: PresenceState) => void
  /**
   * Insert a `DelayedEntering` half-step before the entering animation so the
   * layout settles first — avoids first-frame flicker for elements whose
   * start frame depends on measured layout.
   */
  enableDelay?: boolean
  /** Fires once the element has fully entered. */
  onOpen?: () => void
  /** Fires once the element has fully left. */
  onClose?: () => void
  /** Verbose lifecycle tracing through `console.info`. */
  debugLog?: boolean
}

/**
 * Slot props surfaced by the default slot:
 *
 *   - `present` — boolean back-compat shim. Stays `true` while the element is
 *     mounted (covers v1 `present` semantics).
 *   - `phase` — legacy four-phase enum kept so v1 templates that read
 *     `phase === 'exiting'` don't break. Derived from `state`.
 *   - `status` — the public {@link PresenceAnimationStatus} flags.
 *   - `state` — the raw {@link PresenceState} enum for advanced consumers.
 */
export interface PresenceSlotProps {
  present: boolean
  phase: 'entering' | 'entered' | 'exiting' | 'exited'
  status: PresenceAnimationStatus
  state: PresenceState
}

function statePhase(state: PresenceState): PresenceSlotProps['phase'] {
  switch (state) {
    case PresenceState.Entering:
    case PresenceState.DelayedEntering:
      return 'entering'
    case PresenceState.Entered:
      return 'entered'
    case PresenceState.Leaving:
      return 'exiting'
    default:
      return 'exited'
  }
}

/**
 * Lynx-safe `Presence` — drives a state machine off real
 * `bindanimation*` / `bindtransition*` events so consumers can wait for an
 * animation to truly finish before unmounting (with a 24-frame fallback for
 * elements that don't animate).
 *
 * Replaces the v1 `setTimeout`-based stub. The `enterDuration` / `exitDuration`
 * props are gone — the whole point of this port is to STOP using timers as
 * the source of truth. The slot prop `present` and the `forceMount` prop
 * stay so existing call sites (Dialog, Sheet, ...) keep working until they
 * migrate to the inject key in Phase 2.
 */
const Presence = defineComponent({
  name: 'Presence',
  props: {
    show: {
      type: Boolean,
      default: undefined,
    },
    present: {
      type: Boolean,
      default: undefined,
    },
    forceMount: {
      type: Boolean,
      default: false,
    },
    state: {
      type: Number as PropType<PresenceState>,
      default: undefined,
    },
    setPresenceState: {
      type: Function as PropType<(state: PresenceState) => void>,
      default: undefined,
    },
    enableDelay: {
      type: Boolean,
      default: false,
    },
    onOpen: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    debugLog: {
      type: Boolean,
      default: false,
    },
  },
  slots: {} as SlotsType<{
    default: (props: PresenceSlotProps) => any
  }>,
  setup(props, { slots, expose }) {
    // `show` is the canonical input. `present` is a v1 alias — favour `show`
    // when both are supplied so Phase-2 migrations can land alongside still-
    // present v1 templates without a flag day.
    const showRef = computed<boolean>(() => {
      if (props.show !== undefined) return props.show
      if (props.present !== undefined) return props.present
      return false
    })

    // Internal state machine — used when the caller doesn't drive `state`.
    // Defaults to Left so the initial `show -> handleShow` transition runs.
    const internalState = ref<PresenceState>(PresenceState.Left)
    const stateRef = computed<PresenceState>({
      get: () =>
        props.state !== undefined ? props.state : internalState.value,
      set: (next) => {
        if (props.setPresenceState) {
          // Controlled: bubble up; the parent re-feeds `state` on the next
          // render. Don't touch the internal ref or we shadow the controlled
          // value if the parent is slow to echo it back.
          props.setPresenceState(next)
          return
        }
        internalState.value = next
      },
    })

    const setPresenceState = (next: PresenceState) => {
      stateRef.value = next
    }

    const enableDelayRef = toRef(props, 'enableDelay')

    const presence = usePresence({
      show: showRef,
      state: stateRef,
      setPresenceState,
      enableDelay: enableDelayRef,
      onOpen: props.onOpen,
      onClose: props.onClose,
      debugLog: props.debugLog,
    })

    provide(PresenceContextKey, presence)

    const status = computed<PresenceAnimationStatus>(() =>
      resolveAnimationStatus({
        state: stateRef.value,
        enableDelay: enableDelayRef.value,
      }),
    )
    const phase = computed<PresenceSlotProps['phase']>(() =>
      statePhase(stateRef.value),
    )
    // v1 `present` slot prop: stays true whenever the child is mounted.
    const isPresent = computed<boolean>(() => presence.controllers.mount.value)

    expose({
      present: isPresent,
      phase,
      state: stateRef,
      status,
    })

    const instance = getCurrentInstance()
    const slotProps = computed<PresenceSlotProps>(() => ({
      present: isPresent.value,
      phase: phase.value,
      status: status.value,
      state: stateRef.value,
    }))

    return () => {
      const shouldRender = props.forceMount || presence.controllers.mount.value
      if (!shouldRender) return null

      const children = renderSlotFragments(
        slots.default?.(slotProps.value) ?? [],
      )

      if (children.length > 1) {
        const componentName = instance?.parent?.type.name
          ? `<${instance.parent.type.name} />`
          : 'component'

        throw new Error(
          [
            `Detected invalid children for \`${componentName}\` for \`Presence\` component.`,
            '',
            'Note: Presence works similarly to `v-if` directly, but it waits for animation/transition to finish before unmounting. It expects only one direct child of a valid VNode type.',
            'You can apply a few solutions:',
            [
              'Provide a single child element so the `presence` directive attaches correctly.',
              'Ensure the first child is an actual element instead of a raw text node or comment node.',
            ]
              .map(line => `  - ${line}`)
              .join('\n'),
          ].join('\n'),
        )
      }

      return (children[0] ?? null) as VNode | null
    }
  },
})

export default Presence
