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

  it('announces the current page via accessibility-value; others carry none', () => {
    const { container } = render(Pagination)
    expect(container.querySelector('[accessibility-label="Page 1"]')?.getAttribute('accessibility-value')).toBe('selected')
    expect(container.querySelector('[accessibility-label="Page 2"]')?.getAttribute('accessibility-value')).toBeNull()
  })

  it('exposes the enabled nav buttons as labelled buttons', () => {
    const { container } = render(Pagination)
    // On page 1 the Next/Last buttons are enabled and keep the button trait;
    // First/Prev are disabled, which flips the trait to "disabled".
    for (const label of ['Next Page', 'Last Page']) {
      const el = container.querySelector(`[accessibility-label="${label}"]`)!
      expect(el).not.toBeNull()
      expect(el.getAttribute('accessibility-traits')).toBe('button')
      expect(el.getAttribute('accessibility-element')).toBe('true')
    }
    for (const label of ['First Page', 'Previous Page']) {
      const el = container.querySelector(`[accessibility-label="${label}"]`)!
      expect(el).not.toBeNull()
      expect(el.getAttribute('accessibility-traits')).toBe('disabled')
    }
  })

  it('hides the decorative ellipsis from the a11y tree', () => {
    const { container } = render(Pagination, { showEdges: true })
    const ellipsis = container.querySelector('[data-type="ellipsis"]')!
    expect(ellipsis).not.toBeNull()
    expect(ellipsis.getAttribute('accessibility-element')).toBe('false')
  })
})
