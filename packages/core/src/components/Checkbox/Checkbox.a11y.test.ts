import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Checkbox from './story/_Checkbox.vue'

// Native Lynx a11y output (via useA11y). Behavioural assertions live in
// Checkbox.test.ts; this file covers the accessibility-* surface only.
describe('Checkbox a11y', () => {
  it('exposes a focusable checkbox button', () => {
    const { container } = render(Checkbox)
    const el = container.querySelector('[data-testid="checkbox"]')!
    expect(el).not.toBeNull()
    expect(el.getAttribute('accessibility-traits')).toBe('button')
    expect(el.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces checked state via accessibility-value', async () => {
    const { container } = render(Checkbox)
    const el = container.querySelector('[data-testid="checkbox"]')!
    expect(el.getAttribute('accessibility-value')).toBe('unchecked')
    fireEvent.tap(el)
    await waitForUpdate()
    expect(el.getAttribute('accessibility-value')).toBe('checked')
  })

  it('announces the indeterminate state as "mixed"', () => {
    const { container } = render(Checkbox, { modelValue: 'indeterminate' })
    const el = container.querySelector('[data-testid="checkbox"]')!
    expect(el.getAttribute('accessibility-value')).toBe('mixed')
  })

  it('flips the trait to "disabled" when disabled', () => {
    const { container } = render(Checkbox, { disabled: true })
    const el = container.querySelector('[data-disabled]')!
    expect(el.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
