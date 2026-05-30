import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Toggle from './story/_Toggle.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Toggle.test.ts.
describe('Toggle a11y', () => {
  it('exposes a focusable button', () => {
    const { container } = render(Toggle)
    const el = container.querySelector('[data-state]')!
    expect(el).not.toBeNull()
    expect(el.getAttribute('accessibility-traits')).toBe('button')
    expect(el.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces pressed state via accessibility-value', () => {
    const off = render(Toggle).container.querySelector('[data-state]')!
    expect(off.getAttribute('accessibility-value')).toBe('not pressed')

    const on = render(Toggle, { modelValue: true }).container.querySelector('[data-state]')!
    expect(on.getAttribute('accessibility-value')).toBe('pressed')
  })

  it('flips the trait to "disabled" when disabled', () => {
    const { container } = render(Toggle, { disabled: true })
    const el = container.querySelector('[data-state]')!
    expect(el.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
