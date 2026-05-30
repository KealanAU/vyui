import { describe, expect, it } from 'vitest'
import { render } from '@vyui/testing-utils'
import { TabsList, TabsRoot, TabsTrigger } from '.'
import Tabs from './story/_Tabs.vue'

// Native Lynx a11y output (via useA11y). Behaviour lives in Tabs.test.ts.
describe('Tabs a11y', () => {
  it('exposes each trigger as a focusable tab', () => {
    const { container } = render(Tabs)
    const triggers = container.querySelectorAll('[accessibility-traits="tabbar"]')
    expect(triggers.length).toBe(2)
    triggers.forEach((el) => {
      expect(el.getAttribute('accessibility-role-description')).toBe('tab')
      expect(el.getAttribute('accessibility-element')).toBe('true')
    })
  })

  it('announces the selected tab via accessibility-value; unselected carries none', () => {
    const { container } = render(Tabs)
    const triggers = container.querySelectorAll('[accessibility-traits="tabbar"]')
    expect(triggers[0].getAttribute('accessibility-value')).toBe('selected')
    expect(triggers[1].getAttribute('accessibility-value')).toBeNull()
  })

  it('flips the trait to "disabled" for a disabled trigger', () => {
    const { container } = render({
      components: { TabsRoot, TabsList, TabsTrigger },
      template: `
        <TabsRoot :default-value="1">
          <TabsList>
            <TabsTrigger :value="1">Account</TabsTrigger>
            <TabsTrigger value="tab2" disabled data-testid="disabled-tab">Password</TabsTrigger>
          </TabsList>
        </TabsRoot>
      `,
    })
    const disabledTab = container.querySelector('[data-testid="disabled-tab"]')!
    expect(disabledTab.getAttribute('accessibility-traits')).toBe('disabled')
  })
})
