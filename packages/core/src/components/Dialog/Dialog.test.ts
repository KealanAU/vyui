import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot'
import Dialog from './story/_Dialog.vue'

afterEach(() => {
  // Catch a leaked entry from any failed test.
  overlayEntries.value = []
})

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// Each rAF in jsdom is a `setTimeout(16)`. A handful of these are needed to
// let `delayFrames` chains and the 24-frame fallback inside Presence settle
// in the leaving direction.
function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}
function frames(n: number) {
  return wait(n * 16 + 32)
}

describe('dialog', () => {
  it('does not render the content while closed', () => {
    const { container } = render(Dialog)
    expect(q(container, 'content')).toBeNull()
  })

  it('opens on trigger tap and reflects data-state on the trigger', async () => {
    const { container } = render(Dialog)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('data-state')).toBe('closed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(trigger.getAttribute('data-state')).toBe('open')
  })

  it('closes when DialogClose is tapped (captured-provides bridge)', async () => {
    const { container } = render(Dialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'close')).not.toBeNull()
    fireEvent.tap(q(container, 'close')!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('modal: tapping the backdrop dismisses the dialog', async () => {
    const { container } = render(Dialog, { rootProps: { modal: true } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    // OverlayBackdrop is the ancestor `view` of the content.
    const backdrop = content.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('modal: tapping the inner content does NOT dismiss (tap.stop)', async () => {
    const { container } = render(Dialog, { rootProps: { modal: true } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    fireEvent.tap(content)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('non-modal: backdrop tap also dismisses', async () => {
    const { container } = render(Dialog, { rootProps: { modal: false } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('emits interactOutside and pointerDownOutside when the backdrop is tapped', async () => {
    const events: string[] = []
    const { container } = render({
      components: { Dialog },
      setup() {
        return {
          rootProps: { modal: true },
          onInteract: () => events.push('interactOutside'),
          onPointerDown: () => events.push('pointerDownOutside'),
        }
      },
      template: '<Dialog :rootProps="rootProps" @interactOutside="onInteract" @pointerDownOutside="onPointerDown" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(events).toContain('interactOutside')
    expect(events).toContain('pointerDownOutside')
  })

  it('stays open when interactOutside is prevented', async () => {
    const { container } = render({
      components: { Dialog },
      setup() {
        return {
          rootProps: { modal: true },
          onInteract: (e: any) => e.preventDefault(),
        }
      },
      template: '<Dialog :rootProps="rootProps" @interactOutside="onInteract" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('renders content while closed when forceMount is true', async () => {
    const { container } = render(Dialog, { forceMount: true })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('respects v-model:open', async () => {
    const events: boolean[] = []
    const { container } = render({
      components: { Dialog },
      setup() {
        return {
          rootProps: { open: false },
          onUpdate: (v: boolean) => events.push(v),
        }
      },
      template: '<Dialog :rootProps="rootProps" @update:open="onUpdate" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(events).toEqual([true])
  })

  it('respects defaultOpen', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('DialogOverlayImpl tap closes a modal dialog', async () => {
    const { container } = render(Dialog, { rootProps: { modal: true } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const overlayImpl = q(container, 'overlay-impl')
    expect(overlayImpl).not.toBeNull()
    fireEvent.tap(overlayImpl!)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('unregisters the overlay entry on unmount', async () => {
    const { container, unmount } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(overlayEntries.value.length).toBeGreaterThan(0)
    unmount()
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })

  it('non-modal does not register the DialogOverlayImpl backdrop', async () => {
    const { container } = render(Dialog, { rootProps: { modal: false, defaultOpen: true } })
    await waitForUpdate()
    // Non-modal: DialogOverlay only registers when modal — so the
    // standalone overlay-impl backdrop is absent.
    expect(q(container, 'overlay-impl')).toBeNull()
    // Content is still painted.
    expect(q(container, 'content')).not.toBeNull()
  })

  // ────────────────────────────────────────────────────────────────────────
  // Phase 2 — Presence-driven enter/leave wiring. The state machine in
  // `<Presence>` advances off real `bindanimation*` / `bindtransition*`
  // events; these tests assert (a) the bindings live on the painted DOM
  // nodes and (b) the closing path still terminates via the 24-frame
  // fallback when no animation events fire (jsdom case).
  // ────────────────────────────────────────────────────────────────────────

  // vue-lynx routes `bindXxx` props through Lynx's PAPI event system rather
  // than as DOM attributes — `node-ops.patchProp` calls `__AddEvent`, which
  // the testing-environment shim stores on `el.eventMap[bindEvent:<name>]`.
  // We assert that map so a real Lynx renderer would actually receive the
  // animation lifecycle events the Presence state machine listens for.
  function lynxBound(el: any, name: string): boolean {
    return !!(el?.eventMap?.[`bindEvent:${name}`])
  }

  it('wires bindanimation* / bindtransition* on the content panel', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    const content = q(container, 'content')!
    expect(lynxBound(content, 'animationstart')).toBe(true)
    expect(lynxBound(content, 'animationend')).toBe(true)
    expect(lynxBound(content, 'animationcancel')).toBe(true)
    expect(lynxBound(content, 'transitionstart')).toBe(true)
    expect(lynxBound(content, 'transitionend')).toBe(true)
    expect(lynxBound(content, 'transitioncancel')).toBe(true)
  })

  it('wires bindanimation* / bindtransition* on the backdrop view', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    expect(lynxBound(backdrop, 'animationstart')).toBe(true)
    expect(lynxBound(backdrop, 'animationend')).toBe(true)
    expect(lynxBound(backdrop, 'animationcancel')).toBe(true)
    expect(lynxBound(backdrop, 'transitionstart')).toBe(true)
    expect(lynxBound(backdrop, 'transitionend')).toBe(true)
    expect(lynxBound(backdrop, 'transitioncancel')).toBe(true)
  })

  it('firing the bound animationend advances the Presence state machine', async () => {
    // The bound handler is the Presence-context `handleKFEnd`. Driving the
    // listener manually mirrors what Lynx delivers in production and is
    // exactly the signal `usePresence` uses to advance Entering → Entered.
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    const trigger = q(container, 'trigger')!
    // `defaultOpen` seeds groupState as `Entering`, so the trigger is busy.
    expect(trigger.hasAttribute('data-busy')).toBe(true)

    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    // Fire the start + end on both layers — Presence sees the kf cycle
    // complete and advances both inner state machines to Entered.
    const fire = (el: any, name: string) => {
      const handler = el.eventMap?.[`bindEvent:${name}`]
      if (handler)
        el.dispatchEvent(new Event(`bindEvent:${name}`))
    }
    fire(content, 'animationstart')
    fire(content, 'animationend')
    fire(backdrop, 'animationstart')
    fire(backdrop, 'animationend')
    await waitForUpdate()
    // Combined Entered → trigger is no longer busy.
    expect(trigger.hasAttribute('data-busy')).toBe(false)
  })

  it('paints the ui-* presence variants on backdrop and content', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    // Initial paint with `defaultOpen` seeds the controlled state at
    // `Entering`, so both nodes carry the `ui-open` / `ui-entering` /
    // `ui-animating` triad until the entering animation lands. `ui-closed`
    // is absent because the panel and backdrop are conceptually open.
    expect(content.className).toContain('vyui-dialog-content')
    expect(content.className).toContain('ui-open')
    expect(content.className).not.toContain('ui-closed')
    expect(backdrop.className).toContain('vyui-dialog-backdrop')
    expect(backdrop.className).toContain('ui-open')
    expect(backdrop.className).not.toContain('ui-closed')
  })

  it('after Leaving → handleKFEnd → Left, the content unmounts', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    // Let the entering schedule + the 24-frame fallback land both layers in
    // Entered before we test the leaving path — otherwise the `Left → close`
    // shortcut in Presence would skip the Leaving phase entirely.
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()

    // Drive the close: tapping the backdrop fires `interactOutside` →
    // `onOpenChange(false)`, which flips `show` on both inner Presences.
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()

    // Wait long enough for the leaving-fallback (24 frames) to fire on both
    // layers — no `bindanimationend` is dispatched in jsdom, so the state
    // machine has to use its own MAX_WAIT_FRAMES timeout to advance.
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('exposes data-busy on the trigger while the group is animating', async () => {
    const { container } = render(Dialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    const trigger = q(container, 'trigger')!
    // `defaultOpen` seeds groupState in DialogRoot as `Entering`, so the
    // trigger should be marked busy until the entering animation settles.
    expect(trigger.hasAttribute('data-busy')).toBe(true)
    // After the Presence fallback lands both layers in Entered, the combined
    // state becomes Entered and the trigger drops `data-busy`.
    await frames(40)
    await waitForUpdate()
    expect(trigger.hasAttribute('data-busy')).toBe(false)
  })
})
