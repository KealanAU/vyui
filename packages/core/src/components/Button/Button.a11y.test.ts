import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Button from './story/_Button.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Button.test.ts.
describe('Button a11y', () => {
  it('announces as a focusable button', () => {
    const { container } = render(Button)
    const btn = container.querySelector('[data-testid="btn"]')!
    expect(btn.getAttribute('accessibility-traits')).toBe('button')
    expect(btn.getAttribute('accessibility-element')).toBe('true')
  })

  it('flips the trait to "disabled" when disabled', () => {
    const { container } = render(Button, { disabled: true })
    const btn = container.querySelector('[data-testid="btn"]')!
    expect(btn.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
