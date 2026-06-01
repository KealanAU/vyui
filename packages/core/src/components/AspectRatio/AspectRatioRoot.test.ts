import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import * as Exports from '.'
import AspectRatio from './story/_AspectRatio.vue'

describe('AspectRatio', () => {
  it('exports AspectRatioRoot and the AspectRatio alias', () => {
    expect(Exports.AspectRatioRoot).toBeDefined()
    expect(Exports.AspectRatio).toBeDefined()
    expect(Exports.AspectRatio).toBe(Exports.AspectRatioRoot)
  })

  it('defaults to a 1:1 ratio via the native aspect-ratio CSS property', () => {
    const { container } = render(AspectRatio)
    const el = container.querySelector('[data-vyui-aspect-ratio]')!
    expect(el.getAttribute('data-vyui-aspect-ratio')).toBe('1')
    expect(el.getAttribute('style') ?? '').toContain('aspect-ratio: 1')
  })

  it('defaults to width: 100% so the ratio has a definite dimension to size from', () => {
    const { container } = render(AspectRatio)
    const el = container.querySelector('[data-vyui-aspect-ratio]')!
    expect(el.getAttribute('style') ?? '').toContain('width: 100%')
  })

  it('reflects a custom ratio on the element', () => {
    const { container } = render(AspectRatio, { ratio: 16 / 9 })
    const el = container.querySelector('[data-vyui-aspect-ratio]')!
    expect(el.getAttribute('data-vyui-aspect-ratio')).toBe(String(16 / 9))
    expect(el.getAttribute('style') ?? '').toContain(`aspect-ratio: ${16 / 9}`)
  })

  it('does not emit a padding-bottom wrapper (Lynx uses native aspect-ratio)', () => {
    const { container } = render(AspectRatio, { ratio: 16 / 9 })
    expect(container.querySelector('[data-vyui-aspect-ratio-wrapper]')).toBeNull()
    expect(container.innerHTML).not.toContain('padding-bottom')
  })

  it('renders default slot content', () => {
    const { container } = render(AspectRatio)
    expect(container.innerHTML).toContain('slot-content')
  })
})
