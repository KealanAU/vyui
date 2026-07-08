// vyui original component — not part of reka-ui.
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { render } from '@vyui/testing-utils'
import IslandContainer from './IslandContainer.vue'

describe('IslandContainer', () => {
  it('renders as a view element by default', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer id="island" />`,
    })
    const { container } = render(Component)
    const el = container.querySelector('#island')!
    expect(el.tagName.toLowerCase()).toBe('view')
  })

  it('renders a custom element via the `as` prop', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer as="scroll-view" id="island" />`,
    })
    const { container } = render(Component)
    const el = container.querySelector('#island')!
    expect(el.tagName.toLowerCase()).toBe('scroll-view')
  })

  it('renders the default slot content', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer><text>slot-content</text></IslandContainer>`,
    })
    const { container } = render(Component)
    expect(container.innerHTML).toContain('slot-content')
  })

  it('applies the baseline island classes', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer id="island" />`,
    })
    const { container } = render(Component)
    const cls = container.querySelector('#island')!.getAttribute('class') ?? ''
    expect(cls).toContain('rounded-2xl')
    expect(cls).toContain('bg-white/70')
    expect(cls).toContain('backdrop-blur-xl')
    expect(cls).toContain('border')
    expect(cls).toContain('shadow-lg')
  })

  it('lets a caller class override the baseline via tailwind-merge', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer id="island" class="rounded-none" />`,
    })
    const { container } = render(Component)
    const cls = container.querySelector('#island')!.getAttribute('class') ?? ''
    expect(cls).toContain('rounded-none')
    expect(cls).not.toContain('rounded-2xl')
  })

  it('accepts an array of classes', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      setup() {
        return { extra: ['bg-black/60', 'text-white'] }
      },
      template: `<IslandContainer id="island" :class="extra" />`,
    })
    const { container } = render(Component)
    const cls = container.querySelector('#island')!.getAttribute('class') ?? ''
    expect(cls).toContain('bg-black/60')
    expect(cls).toContain('text-white')
    // caller's bg-black/60 wins over the baseline bg-white/70 (same utility group)
    expect(cls).not.toContain('bg-white/70')
  })

  it('keeps unrelated baseline classes when only a subset is overridden', () => {
    const Component = defineComponent({
      components: { IslandContainer },
      template: `<IslandContainer id="island" class="bg-black/60" />`,
    })
    const { container } = render(Component)
    const cls = container.querySelector('#island')!.getAttribute('class') ?? ''
    expect(cls).toContain('bg-black/60')
    expect(cls).not.toContain('bg-white/70')
    // radius/border/shadow baseline untouched by a background-only override
    expect(cls).toContain('rounded-2xl')
    expect(cls).toContain('border-black/5')
  })
})
