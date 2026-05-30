import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Tabs from './story/_Tabs.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Tabs.test.ts.
describe('Tabs a11y', () => {
  it('exposes each trigger as a focusable tab', () => {
    const { container } = render(Tabs)
    const triggers = container.querySelectorAll('[accessibility-traits="tabbar"]')
    expect(triggers.length).toBe(2)
    triggers.forEach((el) => {
      expect(el.getAttribute('accessibility-role-description')).toBe('tab')
      expect(el.getAttribute('accessibility-element')).toBe('true')
    })
  })

  it('announces selected/unselected state via accessibility-value', () => {
    const { container } = render(Tabs)
    const triggers = container.querySelectorAll('[accessibility-traits="tabbar"]')
    expect(triggers[0].getAttribute('accessibility-value')).toBe('selected')
    expect(triggers[1].getAttribute('accessibility-value')).toBe('unselected')
  })
})
