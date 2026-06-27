import { beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from '@vyui/testing-utils'
import Icon, { type IconProps } from './Icon.vue'
import { registerIconSet, resolveIconSvg } from './resolve'

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

describe('resolveIconSvg (cache)', () => {
  it('returns identical results for repeated calls with the same key', () => {
    const a = resolveIconSvg('lucide:check', { size: 16 })
    const b = resolveIconSvg('lucide:check', { size: 16 })
    expect(a).not.toBeNull()
    expect(b).toBe(a)
  })

  it('keys on size and color so variants do not collide', () => {
    const red = resolveIconSvg('lucide:check', { size: 16, color: '#ff0000' })
    const blue = resolveIconSvg('lucide:check', { size: 16, color: '#0000ff' })
    expect(red).toContain('#ff0000')
    expect(blue).toContain('#0000ff')
  })

  it('re-resolves a name after its set is registered (clears cached null)', () => {
    expect(resolveIconSvg('mdi:account', { size: 16 })).toBeNull()
    registerIconSet('mdi', {
      prefix: 'mdi',
      width: 24,
      height: 24,
      icons: { account: { body: '<path d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>' } },
    })
    expect(resolveIconSvg('mdi:account', { size: 16 })).not.toBeNull()
  })
})

describe('resolveIconSvg (color sanitisation)', () => {
  it('accepts the CSS color syntaxes consumers legitimately pass', () => {
    for (const color of ['red', '#ff0000', 'rgb(255, 0, 0)', 'rgb(255 0 0 / 50%)', 'hsl(210, 50%, 40%)']) {
      const svg = resolveIconSvg('lucide:check', { size: 16, color })
      expect(svg).toContain(color)
      expect(svg).not.toContain('currentColor')
    }
  })

  it('ignores a color that would break out of the SVG attribute', () => {
    const payload = '"><image href="x" onerror="alert(1)"><path fill="'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const svg = resolveIconSvg('lucide:check', { size: 16, color: payload })
      expect(svg).not.toContain('onerror')
      expect(svg).toContain('currentColor')
      expect(warn).toHaveBeenCalledOnce()
      expect(warn.mock.calls[0][0]).toContain('[vyui/Icon]')
    }
    finally {
      warn.mockRestore()
    }
  })
})

describe('Icon (component name)', () => {
  it('renders the supplied Vue component directly instead of an <svg>', () => {
    const Marker = defineComponent({
      name: 'IconMarkerStub',
      setup() {
        return () => h('view', { 'data-testid': 'marker-component' })
      },
    })
    const { container } = mountWith({ name: Marker })
    expect(container.querySelector('[data-testid="marker-component"]')).not.toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })
})
