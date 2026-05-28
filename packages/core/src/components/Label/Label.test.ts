// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import LabelStory from './story/_Label.vue'

describe('test label functionalities', () => {
  it('should render without crashing', () => {
    const { container } = render(LabelStory)
    expect(container.querySelector('text')).not.toBeNull()
  })

  it('should render with a default slot', () => {
    const { container } = render(LabelStory, { text: 'Label' })
    expect(container.querySelector('text')!.textContent).toBe('Label')
  })

  it('should render with a `for` attribute', () => {
    const { container } = render(LabelStory, { for: 'input' })
    expect(container.querySelector('text')!.getAttribute('for')).toBe('input')
  })

  it('should render with a `for` attribute and a default slot', () => {
    const { container } = render(LabelStory, { for: 'input', text: 'Label' })
    const el = container.querySelector('text')!
    expect(el.getAttribute('for')).toBe('input')
    expect(el.textContent).toBe('Label')
  })
})
