import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import AlertDialog from './story/_AlertDialog.vue'

afterEach(() => {
  overlayEntries.value = []
})

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// `usePresence` chains rAF callbacks through `delayFrames`. In jsdom rAF is a
// 16ms setTimeout — waiting `n` frames + a small margin lets all scheduled
// callbacks settle. 24 is the MAX_WAIT_FRAMES fallback in `usePresence`, so
// `frames(40)` is enough to fully drive Entering → Entered or Leaving → Left
// when no real animation event fires.
function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}
function frames(n: number) {
  return wait(n * 16 + 32)
}

// Fire the leaving animation on both the painted backdrop and the panel so
// `usePresence` short-circuits its fallback timer and advances straight to
// `Left`. The test setup paints both views through the OverlayRoot portal.
function fireLeaveAnimations(container: Element) {
  const content = q(container, 'content')
  if (content) {
    fireEvent.animationend(content)
    const backdrop = content.parentElement
    if (backdrop) fireEvent.animationend(backdrop)
  }
}

describe('alertDialog', () => {
  it('does not render content while closed', () => {
    const { container } = render(AlertDialog)
    expect(q(container, 'content')).toBeNull()
  })

  it('opens on trigger tap', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(q(container, 'trigger')!.getAttribute('data-state')).toBe('open')
  })

  it('does NOT dismiss when the backdrop is tapped (load-bearing invariant)', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('AlertDialogAction closes (after the leaving animation settles) and emits click', async () => {
    const events: string[] = []
    const { container } = render({
      components: { AlertDialog },
      setup() {
        return { onClick: () => events.push('click') }
      },
      template: '<AlertDialog @click="onClick" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    // Let the entering schedule settle past Initial / Left so the close path
    // actually exercises Leaving (not the synchronous Initial → Left short
    // circuit inside `usePresence#handleDismiss`).
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'action')!)
    await waitForUpdate()
    // State machine is now in Leaving — content still painted while the
    // leaving animation runs. Drive it to Left by firing animationend on
    // both the backdrop view and the panel view.
    fireLeaveAnimations(container)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
    expect(events).toEqual(['click'])
  })

  it('AlertDialogCancel closes the dialog after the leaving animation settles', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'cancel')!)
    await waitForUpdate()
    fireLeaveAnimations(container)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('falls back to unmount after MAX_WAIT_FRAMES when no animation event fires', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    fireEvent.tap(q(container, 'cancel')!)
    // No animation events at all — the 24-frame fallback in `usePresence`
    // force-progresses Leaving → Left.
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('only a single (modal) content variant exists — no NonModal alternative', async () => {
    // Negative: passing modal:false to a Dialog story would render a NonModal
    // variant; AlertDialog has only AlertDialogContentModal. We assert by
    // confirming the AlertDialog story exposes no modal prop and the
    // exported module includes only the modal variant.
    const mod = await import('../../index')
    expect((mod as any).AlertDialogContentModal).toBeDefined()
    expect((mod as any).AlertDialogContentNonModal).toBeUndefined()
  })

  it('renders content while closed when forceMount is true', async () => {
    const { container } = render(AlertDialog, { forceMount: true })
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('Action/Cancel inject root context through the captured-provides bridge', async () => {
    // Painted Action/Cancel live inside the OverlayRoot portal. They call
    // `rootContext.onOpenChange(false)`, proving the inject succeeded.
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'cancel')!)
    await waitForUpdate()
    fireLeaveAnimations(container)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('unregisters the overlay entry on unmount', async () => {
    const { container, unmount } = render(AlertDialog, { rootProps: { defaultOpen: true } })
    await waitForUpdate()
    // Drive Presence to Entered so the painted node is fully settled.
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
    expect(overlayEntries.value.length).toBeGreaterThan(0)
    unmount()
    await waitForUpdate()
    expect(overlayEntries.value.length).toBe(0)
  })

  it('binds animation handlers on the backdrop so firing animationend drives the state machine', async () => {
    // Open the dialog, then close it. The painted backdrop's
    // `bindanimationend` should map to `handleKFEnd` on the injected Presence
    // context — firing `animationend` on the backdrop alone is sufficient to
    // satisfy the `notAnimating()` check inside `handleAnimationEnd` and
    // advance Leaving → Left even before the 24-frame fallback elapses.
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'cancel')!)
    await waitForUpdate()
    // Sanity: content is still painted while Leaving.
    expect(q(container, 'content')).not.toBeNull()
    // Drive both painted views to End — they share the same Presence so
    // either-or settles the state machine; we fire on both to mirror the
    // backdrop + panel wiring.
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    fireEvent.animationend(backdrop)
    fireEvent.animationend(content)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })

  it('exposes the vyui-alert-dialog-backdrop class on the painted backdrop', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    // Wait long enough for the Entering schedule to fire and the 24-frame
    // fallback to advance the state machine to Entered.
    await frames(40)
    await waitForUpdate()
    const content = q(container, 'content')!
    const backdrop = content.parentElement!
    const backdropClass = backdrop.getAttribute('class') ?? ''
    expect(backdropClass).toContain('vyui-alert-dialog-backdrop')
    // Once the state machine has settled in Entered we expect `ui-open` on
    // the backdrop.
    expect(backdropClass).toContain('ui-open')
  })
})
