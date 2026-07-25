// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.
//
// Tests for the ported state-machine Presence. The implementation drives off
// real `bindanimation*` / `bindtransition*` events; we exercise it by reading
// the inject payload and invoking the animation handlers manually — same
// signal the Lynx renderer would deliver.

import { defineComponent, h, inject, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'

import Presence, { PresenceContextKey } from './Presence'
import type { PresenceContextType } from './types'
import { MAX_STUCK_MS } from './usePresence'
import { PresenceState } from './utils'

const CONTENT_TEXT = 'PresenceContent'

// `delayFrames` resolves through `requestAnimationFrame` which in jsdom is a
// `setTimeout(16)` shim. Real timers + a single `await` settles all chained
// frame callbacks; trying to drive this with fake timers fights both the
// rAF queue and Vue's nextTick scheduler.
function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

// One frame ≈ 16ms. Bumped by a small margin so chained rAFs all settle.
function frames(n: number) {
  return wait(n * 16 + 32)
}

describe('Presence — v1 mount/unmount surface', () => {
  it('does not render the child while show is false', async () => {
    const { container } = render({
      components: { Presence },
      template: `<view><Presence :show="false"><view data-testid="content">${CONTENT_TEXT}</view></Presence></view>`,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).toBeNull()
    expect(container.innerHTML).not.toContain(CONTENT_TEXT)
  })

  it('renders the child while show is true', async () => {
    const { container } = render({
      components: { Presence },
      template: `<view><Presence :show="true"><view data-testid="content">${CONTENT_TEXT}</view></Presence></view>`,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('accepts the back-compat `present` prop alias', async () => {
    const { container } = render({
      components: { Presence },
      template: `<view><Presence :present="true"><view data-testid="content">${CONTENT_TEXT}</view></Presence></view>`,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('forceMount keeps the child rendered when show is false', async () => {
    const { container } = render({
      components: { Presence },
      template: `<view><Presence :show="false" :force-mount="true"><view data-testid="content">${CONTENT_TEXT}</view></Presence></view>`,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  })

  it('keeps the child mounted across toggling when forceMount is set', async () => {
    const { container } = render({
      components: { Presence },
      setup() {
        const open = ref(false)
        return { open, toggle: () => (open.value = !open.value) }
      },
      template: `
        <view>
          <view data-testid="trigger" @tap="toggle" />
          <Presence :show="open" :force-mount="true">
            <view data-testid="content">${CONTENT_TEXT}</view>
          </Presence>
        </view>
      `,
    })
    await waitForUpdate()
    const trigger = container.querySelector('[data-testid="trigger"]')!
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="content"]')).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// State machine — we exercise the inject contract directly. Each test wires
// a Probe component that captures the `PresenceContextType` payload so we
// can read `controllers.state` / `controllers.mount` and fire the
// animation handlers the way Lynx would.

interface MountedProbe {
  ctx: PresenceContextType
  setOpen: (next: boolean) => void
}

function mountWithProbe(opts: {
  initialShow: boolean
  enableDelay?: boolean
  onOpen?: () => void
  onClose?: () => void
}): MountedProbe {
  let captured: PresenceContextType | null = null
  let setter: ((v: boolean) => void) | null = null

  const Probe = defineComponent({
    setup() {
      captured = inject(PresenceContextKey, null)
      return () => h('view', { 'data-testid': 'probe' })
    },
  })

  const Wrapper = defineComponent({
    components: { Presence, Probe },
    setup() {
      const open = ref(opts.initialShow)
      setter = (v: boolean) => {
        open.value = v
      }
      return {
        open,
        enableDelay: opts.enableDelay ?? false,
        onOpen: opts.onOpen,
        onClose: opts.onClose,
      }
    },
    template: `
      <view>
        <Presence
          :show="open"
          :enable-delay="enableDelay"
          :on-open="onOpen"
          :on-close="onClose"
        >
          <Probe />
        </Presence>
      </view>
    `,
  })

  render(Wrapper)

  return {
    get ctx() {
      if (!captured) throw new Error('Presence context not yet provided')
      return captured
    },
    setOpen: (v: boolean) => setter!(v),
  } as MountedProbe
}

describe('Presence — state machine via inject', () => {
  it('show=true mounts immediately and the state machine settles in Entered', async () => {
    const onOpen = vi.fn()
    const probe = mountWithProbe({ initialShow: true, onOpen })
    await waitForUpdate()
    // mount flipped true through handleShow → Probe rendered → ctx captured.
    expect(probe.ctx.controllers.mount.value).toBe(true)
    // Wait for the 8-frame Entering schedule + the 24-frame fallback that
    // auto-progresses to Entered when no animation fires.
    await frames(40)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entered)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('keeps state in Entering while an animation is in flight, then advances on handleKFEnd', async () => {
    const onOpen = vi.fn()
    const probe = mountWithProbe({ initialShow: true, onOpen })
    await waitForUpdate()
    // Fire bindanimationstart immediately so the entering-fallback loop
    // short-circuits — leaves the state pinned at Entering until we choose
    // to fire bindanimationend.
    probe.ctx.animationHandlers.handleKFStart()
    await frames(40)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entering)
    expect(onOpen).not.toHaveBeenCalled()
    probe.ctx.animationHandlers.handleKFEnd()
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entered)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('show=false during Entered routes through Leaving → Left → mount=false', async () => {
    const onClose = vi.fn()
    const probe = mountWithProbe({ initialShow: true, onClose })
    await waitForUpdate()
    // Drive into Entered without firing any animation events — the entering
    // fallback timer auto-progresses past Entering.
    await frames(40)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entered)

    probe.setOpen(false)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Leaving)

    // Fire the leaving animation events; isKFAnimating goes true→false, and
    // handleAnimationEnd advances Leaving → Left.
    probe.ctx.animationHandlers.handleKFStart()
    probe.ctx.animationHandlers.handleKFEnd()
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Left)
    expect(probe.ctx.controllers.mount.value).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('falls back to Left after MAX_WAIT_FRAMES if no leaving animation fires', async () => {
    const probe = mountWithProbe({ initialShow: true })
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entered)

    probe.setOpen(false)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Leaving)
    // No animation events at all → after the 24-frame timeout the state
    // machine must force itself to Left.
    await frames(40)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Left)
    expect(probe.ctx.controllers.mount.value).toBe(false)
  })

  it('force-resolves Leaving after MAX_STUCK_MS when the animation end event never arrives', async () => {
    const probe = mountWithProbe({ initialShow: true })
    await waitForUpdate()
    await frames(40)
    await waitForUpdate()

    probe.setOpen(false)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Leaving)

    // Animation starts but its end/cancel is lost — the web failure mode.
    probe.ctx.animationHandlers.handleKFStart()
    await frames(40)
    await waitForUpdate()
    // Past MAX_WAIT_FRAMES, but an animation is in flight so the frame
    // timeout must NOT fire. Only the wall-clock cap may resolve this.
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Leaving)

    // Jump the clock rather than sleeping 3s. Offset (not a fixed value) so
    // anything else reading Date.now stays monotonic.
    const realNow = Date.now
    vi.spyOn(Date, 'now').mockImplementation(() => realNow() + MAX_STUCK_MS + 1)
    try {
      await frames(4)
      await waitForUpdate()
    }
    finally {
      vi.mocked(Date.now).mockRestore()
    }
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Left)
    expect(probe.ctx.controllers.mount.value).toBe(false)
  })

  it('enableDelay lands the state machine in DelayedEntering before Entered', async () => {
    // The DelayedEntering state is scheduled 16 frames after show. We pin
    // animation in flight (handleKFStart) before any waiting so the entering
    // fallback loop won't auto-advance — without that pin, jsdom's near-
    // instant rAF chains would carry us straight to Entered.
    const probe = mountWithProbe({ initialShow: true, enableDelay: true })
    await waitForUpdate()
    probe.ctx.animationHandlers.handleKFStart()
    // Give both schedules (8-frame Entering, 16-frame DelayedEntering) time
    // to fire — the later one wins because state is reactive and the
    // delayFrames callbacks run in order.
    await frames(30)
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.DelayedEntering)
    // Release the animation → entered.
    probe.ctx.animationHandlers.handleKFEnd()
    await waitForUpdate()
    expect(probe.ctx.controllers.state.value).toBe(PresenceState.Entered)
  })
})

describe('Presence — slot prop back-compat', () => {
  it('exposes `present` and `phase` on the default slot', async () => {
    const captured: Array<{ present?: boolean, phase?: string }> = []
    const { container } = render({
      components: { Presence },
      setup() {
        return {
          record: (p: { present: boolean, phase: string }) => {
            captured.push({ present: p.present, phase: p.phase })
            return null
          },
        }
      },
      template: `
        <view>
          <Presence :show="true" :force-mount="true">
            <template #default="slotProps">
              <view :data-present="String(slotProps.present)" :data-phase="slotProps.phase">
                {{ record(slotProps) }}
              </view>
            </template>
          </Presence>
        </view>
      `,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-present="true"]')).not.toBeNull()
    expect(captured.some(c => c.present === true)).toBe(true)
  })
})
