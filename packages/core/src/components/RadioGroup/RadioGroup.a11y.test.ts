import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import RadioGroup from './story/_RadioGroup.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in RadioGroup.test.ts.
describe('RadioGroup a11y', () => {
  it('exposes each radio as a focusable button with a label', () => {
    const { container } = render(RadioGroup)
    const radios = container.querySelectorAll('[accessibility-role-description="radio"]')
    expect(radios.length).toBe(3)
    radios.forEach((el) => {
      expect(el.getAttribute('accessibility-traits')).toBe('button')
      expect(el.getAttribute('accessibility-element')).toBe('true')
    })
    expect(radios[0].getAttribute('accessibility-label')).toBe('Default')
    expect(radios[1].getAttribute('accessibility-label')).toBe('Comfortable')
    expect(radios[2].getAttribute('accessibility-label')).toBe('Compact')
  })

  it('announces checked/unchecked state via accessibility-value', async () => {
    const { container } = render(RadioGroup)
    const radios = container.querySelectorAll('[accessibility-role-description="radio"]')
    expect(radios[0].getAttribute('accessibility-value')).toBe('checked')
    expect(radios[1].getAttribute('accessibility-value')).toBe('unchecked')

    fireEvent.tap(radios[1])
    await waitForUpdate()
    expect(radios[0].getAttribute('accessibility-value')).toBe('unchecked')
    expect(radios[1].getAttribute('accessibility-value')).toBe('checked')
  })

  it('flips the trait to "disabled" when disabled', () => {
    const { container } = render(RadioGroup, { disabled: true })
    const radios = container.querySelectorAll('[accessibility-role-description="radio"]')
    radios.forEach((el) => {
      expect(el.getAttribute('accessibility-traits')).toBe('disabled')
    })
  })
})
