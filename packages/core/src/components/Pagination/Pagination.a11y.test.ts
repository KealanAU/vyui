import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Pagination from './story/_Pagination.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Pagination.test.ts.
describe('Pagination a11y', () => {
  it('labels each page item "Page N" and exposes it as a button', () => {
    const { container } = render(Pagination)
    const page1 = container.querySelector('[accessibility-label="Page 1"]')!
    expect(page1).not.toBeNull()
    expect(page1.getAttribute('accessibility-traits')).toBe('button')
    expect(page1.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces selected/unselected via accessibility-value', () => {
    const { container } = render(Pagination)
    expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('accessibility-value')).toBe('selected')
    expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('accessibility-value')).toBe('unselected')
  })
})
