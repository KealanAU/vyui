import { beforeAll, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from '@vyui/testing-utils'
import Icon, { type IconProps } from './Icon.vue'
import { registerIconSet } from './resolve'

// `resolve.ts` no longer eagerly registers `lucide`, so the test owns its
// fixture. A single-icon hand-crafted set keeps the test isolated from the
// `@iconify-json/lucide` payload.
beforeAll(() => {
  registerIconSet('lucide', {
    prefix: 'lucide',
    width: 24,
    height: 24,
    icons: {
      check: {
        body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>',
      },
    },
  })
})

function mountWith(props: IconProps) {
  const Wrapper = defineComponent({
    name: 'IconWrapper',
    setup() {
      return () => h(Icon, props)
    },
  })
  return render(Wrapper)
}

describe('Icon (string name)', () => {
  it('renders an <svg> element with a :content attribute when name resolves', () => {
    const { container } = mountWith({ name: 'lucide:check' })
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('content') ?? '').toContain('<svg')
  })

  it('uses the default 16px size when size is not provided', () => {
    const { container } = mountWith({ name: 'lucide:check' })
    const style = container.querySelector('svg')?.getAttribute('style') ?? ''
    expect(style).toContain('width: 16px')
    expect(style).toContain('height: 16px')
  })

  it('honours a numeric size', () => {
    const { container } = mountWith({ name: 'lucide:check', size: 32 })
    const style = container.querySelector('svg')?.getAttribute('style') ?? ''
    expect(style).toContain('width: 32px')
    expect(style).toContain('height: 32px')
  })

  it('bakes color into the SVG by replacing currentColor', () => {
    const { container } = mountWith({ name: 'lucide:check', color: '#ff0000' })
    const content = container.querySelector('svg')?.getAttribute('content') ?? ''
    expect(content).not.toContain('currentColor')
    expect(content).toContain('#ff0000')
  })

  it('falls back to default size when size is non-numeric', () => {
    const { container } = mountWith({ name: 'lucide:check', size: 'banana' })
    const style = container.querySelector('svg')?.getAttribute('style') ?? ''
    expect(style).toContain('width: 16px')
  })
})

describe('Icon (component name)', () => {
  it('renders the supplied Vue component directly instead of an <svg>', () => {
    const Marker = defineComponent({
      name: 'Marker',
      setup() {
        return () => h('view', { 'data-testid': 'marker-component' })
      },
    })
    const { container } = mountWith({ name: Marker })
    expect(container.querySelector('[data-testid="marker-component"]')).not.toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })
})
