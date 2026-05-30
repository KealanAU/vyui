import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Separator from './story/_Separator.vue'

// Native Lynx a11y output. Behaviour lives in Separator.test.ts.
describe('Separator a11y', () => {
  it('stays in the a11y tree when semantic (non-decorative)', () => {
    const { container } = render(Separator)
    expect(container.querySelector('[data-orientation]')!.hasAttribute('accessibility-element')).toBe(false)
  })

  it('is removed from the a11y tree when decorative', () => {
    const { container } = render(Separator, { decorative: true })
    expect(container.querySelector('[data-orientation]')!.getAttribute('accessibility-element')).toBe('false')
  })
})
