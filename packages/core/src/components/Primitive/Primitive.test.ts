// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, ref } from 'vue'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { Primitive } from '.'

describe('Primitive', () => {
  it('renders a view element', () => {
    const { container } = render(Primitive)
    expect(container.querySelector('view')).not.toBeNull()
  })

  it('renders a view element when as=view', () => {
    const { container } = render(Primitive, { as: 'view' })
    expect(container.querySelector('view')).not.toBeNull()
  })

  it('bypasses the comment tag', () => {
    // Lynx renders structural `<div>` markup as `<view>` in JSDOM, so we
    // assert on `<view>` here (and below) — the upstream reka-ui port used
    // `<div>` because it was DOM-only.
    const Component = defineComponent({
      components: { Primitive },
      template: `
        <Primitive as="template" data-parent-attr="">
          <!-- this is a comment -->
          <view data-child-attr>Child class</view>
        </Primitive>
      `,
    })
    const { container } = render(Component)
    const element = container.querySelector('view')!
    expect(element.getAttribute('data-parent-attr')).toBe('')
    expect(element.getAttribute('data-child-attr')).toBe('')
  })

  it('renders a view element with a custom attribute', () => {
    const { container } = render(Primitive, { type: 'button' })
    const element = container.querySelector('view')!
    expect(element.getAttribute('type')).toBe('button')
  })

  it('renders image as a childless leaf (native image rejects children)', () => {
    const Component = defineComponent({
      components: { Primitive },
      template: `<Primitive as="image" src="foo.png"><view>ignored</view></Primitive>`,
    })
    const { container } = render(Component)
    const element = container.querySelector('image')!
    expect(element.getAttribute('src')).toBe('foo.png')
    expect(element.childNodes.length).toBe(0)
  })

  it('omits an undefined attr and keeps the defined ones', () => {
    const { container } = render(Primitive, { as: 'view', type: 'button', placeholder: undefined })
    const element = container.querySelector('view')!
    expect(element.getAttribute('type')).toBe('button')
    expect(element.getAttribute('placeholder')).toBeNull()
  })

  // The DOM outcome above can't tell the two cases apart — an omitted attr and
  // one patched as null both leave no attribute. Key *presence* is what drives
  // the difference (Vue patches every key present in the props object, whatever
  // its value), so assert on the keys Primitive actually forwards.
  it('drops undefined attr keys, keeps defined and null ones', () => {
    let forwarded: Record<string, unknown> = {}
    const Probe = markRaw(defineComponent({
      inheritAttrs: false,
      setup(_, { attrs }) {
        forwarded = { ...attrs }
        return () => h('view')
      },
    }))

    render(Primitive, { as: Probe, type: 'button', placeholder: undefined, role: null })

    const keys = Object.keys(forwarded)
    expect(keys).toContain('type')
    expect(keys).not.toContain('placeholder')
    // null stays a deliberate "reset this prop" signal — only undefined is dropped.
    expect(keys).toContain('role')
  })

  it('renders multiple child elements', () => {
    const Component = defineComponent({
      components: { Primitive },
      template: `<Primitive><view>1</view><view>2</view><view>3</view></Primitive>`,
    })
    const { container } = render(Component)
    const outer = container.querySelector('view')!
    expect(outer.querySelectorAll('view').length).toBe(3)
  })

  describe('render as template (asChild)', () => {
    it('does not throw when multiple child elements exist', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template"><view>1</view><view>2</view><view>3</view></Primitive>`,
      })
      expect(() => render(Component)).not.toThrowError(/invalid children/)
      const { container } = render(Component)
      // Lynx wraps the page root in its own `<view>`; assert only on the
      // rendered fragment children (the three siblings the Slot returned).
      const views = Array.from(container.querySelectorAll('view'))
      expect(views.filter(v => /^[123]$/.test(v.textContent ?? '')).length).toBe(3)
    })

    it('passes a custom attribute to the first element', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" type="button"><view>1</view><view>2</view><view>3</view></Primitive>`,
      })
      const { container } = render(Component)
      const elements = Array.from(container.querySelectorAll('view'))
        .filter(v => /^[123]$/.test(v.textContent ?? ''))
      expect(elements[0].getAttribute('type')).toBe('button')
      expect(elements[1].getAttribute('type')).toBeNull()
      expect(elements[2].getAttribute('type')).toBeNull()
    })

    it('merges the child class', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" class="parent-class"><view class="child-class more-child-class">Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('view.child-class')!
      expect(element.getAttribute('class')).toBe('parent-class child-class more-child-class')
    })

    it('merges the child class after update', async () => {
      const Component = defineComponent({
        setup() {
          const isActive = ref(true)
          const toggleActive = () => { isActive.value = !isActive.value }
          return { isActive, toggleActive }
        },
        components: { Primitive },
        template: `
          <view data-testid="root" :data-active="isActive" @tap="toggleActive">
            <Primitive as="template" class="parent-class">
              <view class="child-class more-child-class">
                Child
              </view>
            </Primitive>
          </view>
        `,
      })

      const { container } = render(Component)
      const element = container.querySelector('view.child-class')!
      expect(element.getAttribute('class')).toBe('parent-class child-class more-child-class')

      fireEvent.tap(container.querySelector('[data-testid="root"]')!)
      await waitForUpdate()
      expect(element.getAttribute('class')).toBe('parent-class child-class more-child-class')

      fireEvent.tap(container.querySelector('[data-testid="root"]')!)
      await waitForUpdate()
      expect(element.getAttribute('class')).toBe('parent-class child-class more-child-class')
    })

    it('renders the component passed via as', () => {
      const Button = markRaw(defineComponent({
        setup(_, { slots }) {
          return () => h('button', { id: 'custom-button' }, slots)
        },
      }))
      const Component = defineComponent({
        setup: () => ({ Button }),
        components: { Primitive },
        template: `<Primitive :as="Button" class="parent-class" />`,
      })
      const { container } = render(Component)
      const button = container.querySelector('button')!
      expect(button).not.toBeNull()
      expect(button.getAttribute('id')).toBe('custom-button')
      expect(button.getAttribute('class')).toBe('parent-class')
    })

    it('renders the child element tag', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template"><a>Child class</a></Primitive>`,
      })
      const { container } = render(Component)
      expect(container.querySelector('a')).not.toBeNull()
    })

    it('renders the child component', () => {
      const ChildComponent = defineComponent({
        template: '<div id="child">Hello world</div>',
      })
      const Component = defineComponent({
        components: { Primitive, ChildComponent },
        template: `<Primitive><ChildComponent /></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('#child')!
      expect(element.textContent).toBe('Hello world')
    })

    it('inherits parent and child attributes', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" data-parent-attr=""><view data-child-attr>Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('view[data-child-attr]')!
      expect(element.getAttribute('data-parent-attr')).toBe('')
      expect(element.getAttribute('data-child-attr')).toBe('')
    })

    it('child attributes override parent attributes', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" id="parent" data-type="button"><view id="child" data-type="primary">Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('#child')!
      expect(element.getAttribute('data-type')).toBe('primary')
      expect(element.getAttribute('id')).toBe('child')
    })

    it('asChild=true behaves like as=template', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive :asChild="true" class="parent-class"><button class="child-class">Child element</button></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('button')!
      expect(element).not.toBeNull()
      expect(element.getAttribute('class')).toBe('parent-class child-class')
    })
  })
})
