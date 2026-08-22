import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, q, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import AlertDialog from './story/_AlertDialog.vue'

afterEach(() => {
  overlayEntries.value = []
})

// AlertDialog is Dialog with `role="alertdialog"` — the shared lifecycle
// (Presence, portal registration, v-model) is covered by
// Dialog.test.ts. This file only pins what the role changes.
function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}
function frames(n: number) {
  return wait(n * 16 + 32)
}

describe('alertDialog', () => {
  it('does not dismiss on backdrop tap (load-bearing invariant)', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const backdrop = q(container, 'content')!.parentElement!
    fireEvent.tap(backdrop)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('does not dismiss on AlertDialogOverlay tap either', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'overlay-impl')!)
    await waitForUpdate()
    expect(q(container, 'content')).not.toBeNull()
  })

  it('Action emits click and closes', async () => {
    const events: string[] = []
    const { container } = render({
      components: { AlertDialog },
      setup: () => ({ onClick: () => events.push('click') }),
      template: '<AlertDialog @click="onClick" />',
    })
    fireEvent.tap(q(container, 'trigger')!)
    // Past Entering, so the tap exercises the real Leaving path rather than
    // `usePresence`'s synchronous Initial → Left short circuit.
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'action')!)
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
    expect(events).toEqual(['click'])
  })

  it('Cancel closes', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await frames(40)
    await waitForUpdate()
    fireEvent.tap(q(container, 'cancel')!)
    await frames(40)
    await waitForUpdate()
    expect(q(container, 'content')).toBeNull()
  })
})
