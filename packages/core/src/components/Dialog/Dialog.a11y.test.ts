import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, q, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot'
import Dialog from './story/_Dialog.vue'

afterEach(() => {
  overlayEntries.value = []
})

// Native Lynx a11y output (via useA11y). Behaviour lives in Dialog.test.ts;
// this file covers the accessibility-* surface only.
describe('Dialog a11y', () => {
  it('exposes the trigger as a focusable button', () => {
    const { container } = render(Dialog)
    const trigger = q(container, 'trigger')!
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('flips the trigger accessibility-value collapsed -> expanded on open', async () => {
    const { container } = render(Dialog)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('announces the content as a dialog with exclusive focus', async () => {
    const { container } = render(Dialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    expect(content).not.toBeNull()
    expect(content.getAttribute('accessibility-role-description')).toBe('dialog')
    expect(content.getAttribute('accessibility-traits')).toBe('none')
    expect(content.getAttribute('accessibility-exclusive-focus')).toBe('true')
    // `dialog` is not a valid Lynx trait — it must only live in role-description.
    expect(content.getAttribute('accessibility-traits')).not.toBe('dialog')
  })

  it('leaves the screen reachable when the dialog is non-modal', async () => {
    const { container } = render(Dialog, { rootProps: { modal: false } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')!.getAttribute('accessibility-exclusive-focus')).toBeNull()
  })

  it('exposes the close button as a focusable button that announces its own text', async () => {
    const { container } = render(Dialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const close = q(container, 'close')!
    expect(close).not.toBeNull()
    expect(close.getAttribute('accessibility-traits')).toBe('button')
    // No forced "Close" label — it would clobber the child text on controls
    // like `AlertDialogAction`, which is the same component.
    expect(close.getAttribute('accessibility-label')).toBeNull()
  })

  it('announces the title as a heading', async () => {
    const { container } = render(Dialog)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const title = q(container, 'title')!
    expect(title).not.toBeNull()
    expect(title.getAttribute('accessibility-traits')).toBe('header')
    expect(title.getAttribute('accessibility-heading')).toBe('true')
  })
})
