import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Stepper from './story/_Stepper.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Stepper.test.ts.
describe('Stepper a11y', () => {
  it('exposes each trigger as a focusable button', () => {
    const { container } = render(Stepper)
    const trigger = container.querySelector('[data-testid="stepper-item-trigger-1"]')!
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
  })

  it('reflects the item state in accessibility-value', () => {
    const { container } = render(Stepper)
    // Default modelValue is 1: step 1 active, later steps inactive.
    expect(container.querySelector('[data-testid="stepper-item-trigger-1"]')?.getAttribute('accessibility-value')).toBe('active')
    expect(container.querySelector('[data-testid="stepper-item-trigger-2"]')?.getAttribute('accessibility-value')).toBe('inactive')
  })

  it('flips the trait to "disabled" for a non-focusable step', () => {
    // Linear mode makes future steps non-focusable, which useA11y maps to the
    // disabled trait.
    const { container } = render(Stepper, { stepperProps: { linear: true } })
    expect(container.querySelector('[data-testid="stepper-item-trigger-3"]')?.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
