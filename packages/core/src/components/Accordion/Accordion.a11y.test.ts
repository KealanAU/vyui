import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Accordion from './story/_Accordion.vue'

// Stable hook: a disabled trigger's accessibility-traits flips to "disabled",
// so select the collection-item marker instead of the trait value.
function triggers(container: Element) {
  return container.querySelectorAll('[data-vy-collection-item]')
}

// Native Lynx a11y output (via useA11y, through CollapsibleTrigger). Behaviour
// lives in Accordion.test.ts; this file covers the accessibility-* surface only.
describe('Accordion a11y', () => {
  it('exposes triggers as focusable buttons', () => {
    const { container } = render(Accordion)
    const first = triggers(container)[0]!
    expect(first.getAttribute('accessibility-traits')).toBe('button')
    expect(first.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces collapsed/expanded via accessibility-value', async () => {
    const { container } = render(Accordion)
    const first = triggers(container)[0]!
    expect(first.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(first)
    await waitForUpdate()
    expect(triggers(container)[0]!.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('flips the trait to "disabled" when the root is disabled', () => {
    const { container } = render(Accordion, { disabled: true })
    const first = triggers(container)[0]!
    expect(first.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
