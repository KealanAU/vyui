import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, q, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import Popover from './story/_Popover.vue'

afterEach(() => {
  overlayEntries.value = []
})

// Native Lynx a11y output (via useA11y). Behaviour lives in Popover.test.ts;
// this file covers the accessibility-* surface only.
describe('Popover a11y', () => {
  it('exposes the trigger as a focusable button', () => {
    const { container } = render(Popover)
    const trigger = q(container, 'trigger')!
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('flips the trigger accessibility-value collapsed -> expanded on open', async () => {
    const { container } = render(Popover)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('announces the content as a dialog, reachable while non-modal', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    expect(content).not.toBeNull()
    expect(content.getAttribute('accessibility-role-description')).toBe('dialog')
    expect(content.getAttribute('accessibility-traits')).toBe('none')
    // `dialog` is not a valid Lynx trait — it must only live in role-description.
    expect(content.getAttribute('accessibility-traits')).not.toBe('dialog')
    // `modal` defaults to false, so the rest of the screen stays reachable.
    expect(content.getAttribute('accessibility-exclusive-focus')).toBeNull()
  })

  it('confines assistive tech to the content when modal', async () => {
    const { container } = render(Popover, { rootProps: { modal: true } })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'content')!.getAttribute('accessibility-exclusive-focus')).toBe('true')
  })

  it('exposes the close button as a focusable button labelled "Close"', async () => {
    const { container } = render(Popover)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const close = q(container, 'close')!
    expect(close).not.toBeNull()
    expect(close.getAttribute('accessibility-traits')).toBe('button')
    expect(close.getAttribute('accessibility-label')).toBe('Close')
  })
})
