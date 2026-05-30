import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Select from './story/_Select.vue'

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// Native Lynx a11y output (via useA11y). Behaviour lives in Select.test.ts;
// this file covers the accessibility-* surface only.
describe('Select a11y', () => {
  it('exposes the trigger as a focusable button announcing collapsed/expanded', async () => {
    const { container } = render(Select)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('flips the trigger trait to "disabled" when disabled', () => {
    const { container } = render(Select, { disabled: true })
    expect(q(container, 'trigger')!.getAttribute('accessibility-traits')).toBe('disabled')
  })

  it('announces item selected/unselected via accessibility-value', () => {
    const { container } = render(Select, { modelValue: 'Cherry', defaultOpen: true })
    expect(q(container, 'item-Cherry')!.getAttribute('accessibility-value')).toBe('selected')
    expect(q(container, 'item-Apple')!.getAttribute('accessibility-value')).toBe('unselected')
    expect(q(container, 'item-Cherry')!.getAttribute('accessibility-element')).toBe('true')
  })

  it('updates the announced selection when another item is tapped', async () => {
    const { container } = render(Select)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'item-Banana')!.getAttribute('accessibility-value')).toBe('unselected')
    fireEvent.tap(q(container, 'item-Banana')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'item-Banana')!.getAttribute('accessibility-value')).toBe('selected')
  })

  it('flips a disabled item trait to "disabled"', () => {
    const { container } = render(Select, { itemDisabled: 'Banana', defaultOpen: true })
    expect(q(container, 'item-Banana')!.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
