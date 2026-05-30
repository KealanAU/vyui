// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Rating from './story/_Rating.vue'

describe('given a default Rating', () => {
  let container: Element
  let items: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(Rating, { defaultValue: 1, length: 3, orientation: 'vertical' }))
    items = container.querySelectorAll('[accessibility-traits="button"]')
  })

  it('should render rating items', () => {
    expect(items.length).toBeGreaterThan(0)
  })

  it('should have first item in active state', () => {
    expect(items[0].getAttribute('data-state')).toBe('active')
  })
})

describe('given disabled Rating', () => {
  let container: Element
  let items: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(Rating, { defaultValue: 1, disabled: true, length: 3 }))
    // useA11y flips the trait to `disabled` when disabled, so select items by
    // their bare `disabled` attribute (only the item indicators carry it; the
    // RatingRoot sets data-disabled but not disabled).
    items = container.querySelectorAll('[disabled=""]')
  })

  it('should have first item in active state', () => {
    expect(items[0].getAttribute('data-state')).toBe('active')
  })

  it.each([[0], [1], [2]])('should have disabled attribute on item', (input) => {
    expect(items[input as number].getAttribute('disabled')).toBe('')
    expect(items[input as number].getAttribute('data-disabled')).toBe('')
  })
})
