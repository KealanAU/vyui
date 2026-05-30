import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Combobox from './story/_Combobox.vue'

function getTrigger(container: Element) {
  return container.querySelector('[accessibility-label="Show options"]')!
}

function getInput(container: Element) {
  return container.querySelector('input')!
}

function getItems(container: Element) {
  return Array.from(container.querySelectorAll('[data-combobox-item]'))
}

// Native Lynx a11y output (via useA11y). Behaviour lives in Combobox.test.ts;
// this file covers the accessibility-* surface only.
describe('Combobox a11y', () => {
  it('exposes the trigger as a focusable button with its label', async () => {
    const { container } = render(Combobox)
    const trigger = getTrigger(container)
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
    expect(trigger.getAttribute('accessibility-label')).toBe('Show options')
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('flips the trigger trait to "disabled" when disabled', () => {
    const { container } = render(Combobox, { disabled: true })
    expect(getTrigger(container).getAttribute('accessibility-traits')).toBe('disabled')
  })

  it('marks the input with trait "none"', () => {
    const { container } = render(Combobox)
    expect(getInput(container).getAttribute('accessibility-traits')).toBe('none')
  })

  it('announces item selected/unselected via accessibility-value', async () => {
    const { container } = render(Combobox)
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    const items = getItems(container)
    expect(items[1]!.getAttribute('accessibility-value')).toBeNull()
    expect(items[1]!.getAttribute('accessibility-element')).toBe('true')
    fireEvent.tap(items[1]!)
    await waitForUpdate()
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    expect(getItems(container)[1]!.getAttribute('accessibility-value')).toBe('selected')
  })
})
