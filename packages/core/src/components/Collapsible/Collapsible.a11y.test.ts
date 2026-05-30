import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Collapsible from './story/_Collapsible.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Collapsible.test.ts.
describe('Collapsible a11y', () => {
  it('exposes the trigger as a focusable button', () => {
    const { container } = render(Collapsible)
    const trigger = container.querySelector('[accessibility-traits="button"]')!
    expect(trigger).not.toBeNull()
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces collapsed/expanded via accessibility-value', () => {
    const closed = render(Collapsible).container
      .querySelector('[accessibility-traits="button"]')!
    expect(closed.getAttribute('accessibility-value')).toBe('collapsed')

    const open = render(Collapsible, { defaultOpen: true }).container
      .querySelector('[accessibility-traits="button"]')!
    expect(open.getAttribute('accessibility-value')).toBe('expanded')
  })
})
