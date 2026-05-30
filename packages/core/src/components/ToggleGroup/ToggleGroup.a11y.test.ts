import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import ToggleGroup from './story/_ToggleGroup.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in ToggleGroup.test.ts.
describe('ToggleGroup a11y', () => {
  it('exposes each item as a focusable button', () => {
    const { container } = render(ToggleGroup, { defaultValue: 'center' })
    const items = container.querySelectorAll('[data-testid="toggle-item"]')
    expect(items.length).toBe(3)
    items.forEach((el) => {
      expect(el.getAttribute('accessibility-traits')).toBe('button')
      expect(el.getAttribute('accessibility-element')).toBe('true')
    })
  })

  it('announces pressed / not-pressed state via accessibility-value', () => {
    const { container } = render(ToggleGroup, { defaultValue: 'center' })
    const items = container.querySelectorAll('[data-testid="toggle-item"]')
    expect(items[0].getAttribute('accessibility-value')).toBe('not pressed')
    expect(items[1].getAttribute('accessibility-value')).toBe('pressed')
    expect(items[2].getAttribute('accessibility-value')).toBe('not pressed')
  })

  it('flips the trait to "disabled" when the group is disabled', () => {
    const { container } = render(ToggleGroup, { defaultValue: 'center', disabled: true })
    const items = container.querySelectorAll('[data-testid="toggle-item"]')
    expect(items.length).toBe(3)
    items.forEach((el) => {
      expect(el.getAttribute('accessibility-traits')).toBe('disabled')
    })
  })
})
