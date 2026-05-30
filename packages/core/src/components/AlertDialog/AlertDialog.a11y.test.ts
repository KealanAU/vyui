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

// Native Lynx a11y output (via useA11y). Behaviour lives in AlertDialog.test.ts;
// this file covers the accessibility-* surface only.
describe('AlertDialog a11y', () => {
  it('exposes the trigger as a focusable button', () => {
    const { container } = render(AlertDialog)
    const trigger = q(container, 'trigger')!
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('flips the trigger accessibility-value collapsed -> expanded on open', async () => {
    const { container } = render(AlertDialog)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('announces the content as an alert dialog with exclusive focus', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    expect(content).not.toBeNull()
    expect(content.getAttribute('accessibility-role-description')).toBe('alert dialog')
    expect(content.getAttribute('accessibility-traits')).toBe('none')
    expect(content.getAttribute('accessibility-exclusive-focus')).toBe('true')
    // Neither `alertdialog`/`dialog` nor `alert` is a valid Lynx trait — they
    // must only live in role-description.
    expect(content.getAttribute('accessibility-traits')).not.toBe('dialog')
    expect(content.getAttribute('accessibility-traits')).not.toBe('alert')
  })

  it('exposes the action and cancel controls as focusable buttons', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const action = q(container, 'action')!
    const cancel = q(container, 'cancel')!
    expect(action).not.toBeNull()
    expect(cancel).not.toBeNull()
    expect(action.getAttribute('accessibility-traits')).toBe('button')
    expect(cancel.getAttribute('accessibility-traits')).toBe('button')
  })

  it('announces the title as a heading', async () => {
    const { container } = render(AlertDialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const title = q(container, 'title')!
    expect(title).not.toBeNull()
    expect(title.getAttribute('accessibility-traits')).toBe('header')
    expect(title.getAttribute('accessibility-heading')).toBe('true')
  })
})
