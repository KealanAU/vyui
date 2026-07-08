import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { render } from '@vyui/testing-utils'
import { withDefault } from './withDefault'

// A minimal SFC-shaped source component. `__name` mirrors what the Vue SFC
// compiler stamps onto a real `.vue` component — withDefault() reads it to
// derive the wrapper's `name`.
const Base = {
  __name: 'Base',
  props: {
    size: { type: String, default: 'md' },
  },
  template: `<view :data-size="size" data-testid="base"><slot /></view>`,
}

describe('withDefault', () => {
  it('sets inheritAttrs to false on the returned component', () => {
    const Wrapped = withDefault(Base) as any
    expect(Wrapped.inheritAttrs).toBe(false)
  })

  it('names the wrapper "<sourceName>Wrapper"', () => {
    const Wrapped = withDefault(Base) as any
    expect(Wrapped.name).toBe('BaseWrapper')
  })

  it('falls back to "Wrapper" when the source has no __name', () => {
    const Anonymous = { props: { size: { type: String, default: 'md' } }, template: `<view />` }
    const Wrapped = withDefault(Anonymous) as any
    expect(Wrapped.name).toBe('Wrapper')
  })

  it('applies options.props as defaults when the caller passes nothing', () => {
    const Wrapped = withDefault(Base, { props: { size: 'lg' } })
    const Host = defineComponent({
      components: { Wrapped },
      template: `<Wrapped />`,
    })
    const { container } = render(Host)
    expect(container.querySelector('[data-testid="base"]')!.getAttribute('data-size')).toBe('lg')
  })

  it('lets the caller override the default props', () => {
    const Wrapped = withDefault(Base, { props: { size: 'lg' } })
    const Host = defineComponent({
      components: { Wrapped },
      template: `<Wrapped size="sm" />`,
    })
    const { container } = render(Host)
    expect(container.querySelector('[data-testid="base"]')!.getAttribute('data-size')).toBe('sm')
  })

  it('resolves options.props from a function of the caller attrs', () => {
    const Wrapped = withDefault(Base, {
      props: attrs => ({ size: attrs.variant === 'big' ? 'lg' : 'sm' }),
    })
    const Host = defineComponent({
      components: { Wrapped },
      template: `<Wrapped variant="big" />`,
    })
    const { container } = render(Host)
    expect(container.querySelector('[data-testid="base"]')!.getAttribute('data-size')).toBe('lg')
  })

  it('merges (rather than overrides) the class attribute', () => {
    const Wrapped = withDefault(Base, { props: { class: 'default-class' } })
    const Host = defineComponent({
      components: { Wrapped },
      template: `<Wrapped class="caller-class" />`,
    })
    const { container } = render(Host)
    const cls = container.querySelector('[data-testid="base"]')!.getAttribute('class') ?? ''
    expect(cls).toContain('default-class')
    expect(cls).toContain('caller-class')
  })

  it('forwards the default slot to the wrapped component', () => {
    const Wrapped = withDefault(Base)
    const Host = defineComponent({
      components: { Wrapped },
      template: `<Wrapped><text>slot-content</text></Wrapped>`,
    })
    const { container } = render(Host)
    expect(container.innerHTML).toContain('slot-content')
  })
})
