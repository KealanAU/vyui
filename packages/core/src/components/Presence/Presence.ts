// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Ported from `lynx-family/lynx-ui` `packages/lynx-ui-presence/src/Presence.tsx`.
// `createContext` is replaced with provide/inject keyed by
// {@link PresenceContextKey}; the optional `state` / `setPresenceState` props
// enable a controlled mode (used by `usePresenceGroup`).
//
// Uses `defineComponent` (not `<script setup>`) so the render function can throw
// the same "invalid children" error v1 did, and so the inject key is provided
// from a single setup pass.

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
 * Vue `provide` key for the {@link PresenceContextType} payload `<Presence>`
 * exposes to descendants, which read `controllers.state` for class generation
 * and wire `animationHandlers` to their root `<view>` bindings.
 *
 * Registered through `Symbol.for(...)` so dual-`<script>` SFCs loaded twice
 * (rspack-vue-loader + builtin:swc-loader) still resolve to the same key.
 */
export const PresenceContextKey: InjectionKey<PresenceContextType>
  = Symbol.for('vyui:PresenceContext')

/** Public props for `<Presence>`. */
export interface PresenceProps {
  /**
   * Drives the lifecycle. `true` runs Entering → Entered (or DelayedEntering →
   * Entering → Entered with `enable-delay`); `false` runs Leaving → Left.
   */
  show?: boolean
  /**
   * Controlled state. When provided, `<Presence>` reads/writes through
   * {@link setPresenceState} instead of owning its own `state` ref.
   */
  state?: PresenceState
  /** Setter for the controlled {@link state}. Required when `state` is set. */
  setPresenceState?: (state: PresenceState) => void
  /**
   * Insert a `DelayedEntering` half-step before the entering animation so
   * layout settles first — avoids first-frame flicker for elements whose start
   * frame depends on measured layout.
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
 *   - `present` — true while the element is mounted.
 *   - `phase` — legacy four-phase enum derived from `state`.
 *   - `status` — the public {@link PresenceAnimationStatus} flags.
 *   - `state` — the raw {@link PresenceState} enum.
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
 * Lynx-safe `Presence` — drives a state machine off real `bindanimation*` /
 * `bindtransition*` events so consumers can wait for an animation to truly
 * finish before unmounting, with a 24-frame fallback for elements that don't
 * animate.
 */
const Presence = defineComponent({
  name: 'Presence',
  props: {
    show: {
      type: Boolean,
      default: undefined,
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
    const showRef = computed<boolean>(() => props.show ?? false)

    // Internal state machine — used when the caller doesn't drive `state`.
    // Defaults to Left so the initial `show -> handleShow` transition runs.
    const internalState = ref<PresenceState>(PresenceState.Left)
    const stateRef = computed<PresenceState>({
      get: () =>
        props.state !== undefined ? props.state : internalState.value,
      set: (next) => {
        if (props.setPresenceState) {
          // Controlled: bubble up and let the parent re-feed `state`. Writing
          // the internal ref here would shadow a slow-to-echo parent.
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
    // `present` slot prop: stays true whenever the child is mounted.
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
      if (!presence.controllers.mount.value) return null

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
