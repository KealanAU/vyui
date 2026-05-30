import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import _Input from './story/_Input.vue'

// Native Lynx a11y output. Behaviour lives in Input.test.ts.
describe('Input a11y', () => {
  it('exposes the keyboard trait on the input element', () => {
    const { container } = render(_Input)
    const el = container.querySelector('[data-testid="input"]')!
    expect(el).not.toBeNull()
    expect(el.getAttribute('accessibility-traits')).toBe('keyboard')
  })
})
