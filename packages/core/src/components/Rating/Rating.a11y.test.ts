import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Rating from './story/_Rating.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Rating.test.ts.
describe('Rating a11y', () => {
  it('exposes rating items as focusable buttons', () => {
    const { container } = render(Rating, { defaultValue: 1, length: 3 })
    const items = container.querySelectorAll('[accessibility-traits="button"]')
    expect(items.length).toBeGreaterThan(0)
    expect(items[0].getAttribute('accessibility-element')).toBe('true')
  })

  it('announces selected/unselected state via accessibility-value', () => {
    const { container } = render(Rating, { defaultValue: 1, length: 3 })
    const items = container.querySelectorAll('[accessibility-traits="button"]')
    expect(items[0].getAttribute('accessibility-value')).toBe('selected')
    expect(items[1].getAttribute('accessibility-value')).toBe('unselected')
  })

  it('flips the trait to "disabled" when the rating is disabled', () => {
    const { container } = render(Rating, { defaultValue: 1, disabled: true, length: 3 })
    // RatingRoot sets data-disabled but NOT disabled; only the item
    // indicators carry the bare `disabled` attribute.
    const items = container.querySelectorAll('[disabled=""]')
    expect(items.length).toBeGreaterThan(0)
    items.forEach((item) => {
      expect(item.getAttribute('accessibility-traits')).toBe('disabled')
    })
  })
})
