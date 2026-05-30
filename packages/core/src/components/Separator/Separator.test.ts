// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import Separator from './story/_Separator.vue'
import SeparatorWithSlot from './story/_SeparatorWithSlot.vue'

describe('Separator', () => {
  it('defaults to data-orientation="horizontal"', () => {
    const { container } = render(Separator)
    expect(container.querySelector('[data-orientation]')!.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('reflects a vertical orientation', () => {
    const { container } = render(Separator, { orientation: 'vertical' })
    expect(container.querySelector('[data-orientation]')!.getAttribute('data-orientation')).toBe('vertical')
  })

  it('renders slot content', () => {
    const { container } = render(SeparatorWithSlot)
    expect(container.innerHTML).toContain('slot-content')
  })
})
