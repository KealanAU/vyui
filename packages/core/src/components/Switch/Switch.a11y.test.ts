import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Switch from './_Switch.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Switch.test.ts.
describe('Switch a11y', () => {
  it('exposes a switch with label and role-description', () => {
    const { container } = render(Switch)
    const el = container.querySelector('[accessibility-role-description="switch"]')!
    expect(el).not.toBeNull()
    expect(el.getAttribute('accessibility-traits')).toBe('button')
    expect(el.getAttribute('accessibility-label')).toBe('Airplane mode')
    expect(el.getAttribute('accessibility-element')).toBe('true')
  })

  it('announces on/off state via accessibility-value', async () => {
    const { container } = render(Switch)
    const el = container.querySelector('[accessibility-role-description="switch"]')!
    expect(el.getAttribute('accessibility-value')).toBe('off')
    fireEvent.tap(el)
    await waitForUpdate()
    expect(el.getAttribute('accessibility-value')).toBe('on')
  })
})
