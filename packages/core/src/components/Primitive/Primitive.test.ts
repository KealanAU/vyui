// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw, ref } from 'vue'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { Primitive } from '.'

describe('test Primitive functionalities', () => {
  it('should render view element correctly', () => {
    const { container } = render(Primitive)
    expect(container.querySelector('view')).not.toBeNull()
  })

  it('should render view element when as=view', () => {
    const { container } = render(Primitive, { as: 'view' })
    expect(container.querySelector('view')).not.toBeNull()
  })

  it('should by pass the comment tag', () => {
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

  it('should renders view element with custom attribute', () => {
    const { container } = render(Primitive, { type: 'button' })
    const element = container.querySelector('view')!
    expect(element.getAttribute('type')).toBe('button')
  })

  it('should renders multiple child elements', () => {
    const Component = defineComponent({
      components: { Primitive },
      template: `<Primitive><view>1</view><view>2</view><view>3</view></Primitive>`,
    })
    const { container } = render(Component)
    const outer = container.querySelector('view')!
    expect(outer.querySelectorAll('view').length).toBe(3)
  })

  describe('render as template (asChild)', () => {
    it('should not throw error when multiple child elements exists', () => {
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

    it('should pass custom attribute to first element', () => {
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

    it('should merge child\'s class together', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" class="parent-class"><view class="child-class more-child-class">Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('view.child-class')!
      expect(element.getAttribute('class')).toBe('parent-class child-class more-child-class')
    })

    it('should merge child\'s class after update', async () => {
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

    it('should render the Component that passed in as', () => {
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

    it('should render the child class element tag', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template"><a>Child class</a></Primitive>`,
      })
      const { container } = render(Component)
      expect(container.querySelector('a')).not.toBeNull()
    })

    it('should render the child component', () => {
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

    it('should inherit parent attributes and the child attributes', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" data-parent-attr=""><view data-child-attr>Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('view[data-child-attr]')!
      expect(element.getAttribute('data-parent-attr')).toBe('')
      expect(element.getAttribute('data-child-attr')).toBe('')
    })

    it('should replace parent attributes with child\'s attributes', () => {
      const Component = defineComponent({
        components: { Primitive },
        template: `<Primitive as="template" id="parent" data-type="button"><view id="child" data-type="primary">Child class</view></Primitive>`,
      })
      const { container } = render(Component)
      const element = container.querySelector('#child')!
      expect(element.getAttribute('data-type')).toBe('primary')
      expect(element.getAttribute('id')).toBe('child')
    })

    it('\'asChild=true\' should work the same as \'as=template\'', () => {
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
