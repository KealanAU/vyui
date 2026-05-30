import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { overlayEntries } from '@/components/OverlayRoot/overlayStore'
import DropdownMenu from './story/_DropdownMenu.vue'

afterEach(() => {
  overlayEntries.value = []
})

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// Native Lynx a11y output (via useA11y). Behaviour lives in DropdownMenu.test.ts;
// this file covers the accessibility-* surface only.
describe('DropdownMenu a11y', () => {
  it('exposes the trigger as a focusable button announcing expanded state', async () => {
    const { container } = render(DropdownMenu)
    const trigger = q(container, 'trigger')!
    expect(trigger.getAttribute('accessibility-traits')).toBe('button')
    expect(trigger.getAttribute('accessibility-element')).toBe('true')
    expect(trigger.getAttribute('accessibility-value')).toBe('collapsed')
    fireEvent.tap(trigger)
    await waitForUpdate()
    expect(trigger.getAttribute('accessibility-value')).toBe('expanded')
  })

  it('flips the trigger trait to "disabled" when disabled', () => {
    const { container } = render(DropdownMenu, { triggerDisabled: true })
    expect(q(container, 'trigger')!.getAttribute('accessibility-traits')).toBe('disabled')
  })

  it('exposes the menu content with role-description "menu" and no invalid menu trait', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const content = q(container, 'content')!
    expect(content.getAttribute('accessibility-traits')).toBe('none')
    expect(content.getAttribute('accessibility-role-description')).toBe('menu')
    expect(content.getAttribute('accessibility-element')).toBe('true')
  })

  it('exposes the sub-content with role-description "menu" and trait "none"', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'sub-trigger')!)
    await waitForUpdate()
    const subContent = q(container, 'sub-content')!
    expect(subContent.getAttribute('accessibility-traits')).toBe('none')
    expect(subContent.getAttribute('accessibility-role-description')).toBe('menu')
  })

  it('announces the checkbox item via role-description "checkbox" and accessibility-value', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const cb = q(container, 'checkbox-item')!
    expect(cb.getAttribute('accessibility-role-description')).toBe('checkbox')
    expect(cb.getAttribute('accessibility-element')).toBe('true')
    expect(cb.getAttribute('accessibility-value')).toBe('unchecked')
    fireEvent.tap(cb)
    await waitForUpdate()
    // Re-open the menu to re-query the item from the new render.
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'checkbox-item')!.getAttribute('accessibility-value')).toBe('checked')
  })

  it('announces radio items via role-description "radio" and checked/unchecked value', async () => {
    const { container } = render(DropdownMenu)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    const one = q(container, 'radio-one')!
    const two = q(container, 'radio-two')!
    expect(one.getAttribute('accessibility-role-description')).toBe('radio')
    expect(two.getAttribute('accessibility-role-description')).toBe('radio')
    expect(one.getAttribute('accessibility-value')).toBe('checked')
    expect(two.getAttribute('accessibility-value')).toBe('unchecked')
    fireEvent.tap(two)
    await waitForUpdate()
    expect(q(container, 'radio-one')!.getAttribute('accessibility-value')).toBe('unchecked')
    expect(q(container, 'radio-two')!.getAttribute('accessibility-value')).toBe('checked')
  })
})
