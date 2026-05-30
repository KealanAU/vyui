// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Tabs from './story/_Tabs.vue'
import TabsWithDisabled from './story/_TabsWithDisabled.vue'

describe('given default Tabs', () => {
  let container: Element
  const triggers = () => container.querySelectorAll('[accessibility-traits="tabbar"]')

  beforeEach(() => {
    ;({ container } = render(Tabs))
  })

  it('shows only the active tab content (unmountOnHide) and marks trigger state', () => {
    expect(container.innerHTML).toContain('Make changes')
    expect(container.innerHTML).not.toContain('Change your password')
    expect(triggers()[0].getAttribute('data-state')).toBe('active')
    expect(triggers()[1].getAttribute('data-state')).toBe('inactive')
  })

  it('switches content and state when tapping another trigger, and back again', async () => {
    fireEvent.tap(triggers()[1])
    await waitForUpdate()
    expect(container.innerHTML).toContain('Change your password')
    expect(container.innerHTML).not.toContain('Make changes')
    expect(triggers()[1].getAttribute('data-state')).toBe('active')

    fireEvent.tap(triggers()[0])
    await waitForUpdate()
    expect(container.innerHTML).toContain('Make changes')
    expect(container.innerHTML).not.toContain('Change your password')
  })

  it('emits update:modelValue with the activated value', async () => {
    const updates: unknown[] = []
    const { container: c } = render(Tabs, { 'onUpdate:modelValue': (v: unknown) => updates.push(v) })
    fireEvent.tap(c.querySelectorAll('[accessibility-traits="tabbar"]')[1])
    await waitForUpdate()
    expect(updates).toEqual(['tab2'])
  })
})

describe('given Tabs with a disabled trigger', () => {
  it('does not switch tabs when the disabled trigger is tapped', async () => {
    const { container } = render(TabsWithDisabled)
    const tabs = container.querySelectorAll('[data-testid="tab"]')
    // The disabled trigger uses accessibility-traits="disabled" (not "tabbar").
    expect(tabs[1].getAttribute('data-disabled')).toBe('')

    fireEvent.tap(tabs[1])
    await waitForUpdate()
    expect(container.innerHTML).toContain('Make changes')
    expect(container.innerHTML).not.toContain('Change your password')
  })
})
