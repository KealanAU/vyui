import { describe, expect, it } from 'vitest'
import { fireEvent, q, render, waitForUpdate } from '@vyui/testing-utils'
import Select from './story/_Select.vue'

describe('Select — closed state', () => {
  it('renders the trigger with accessibility-traits="button"', () => {
    const { container } = render(Select)
    expect(q(container, 'trigger')?.getAttribute('accessibility-traits')).toBe('button')
  })

  it('does not render any items while closed', () => {
    const { container } = render(Select)
    expect(q(container, 'item-Apple')).toBeNull()
  })

  it('shows the placeholder when no value is selected', () => {
    const { container } = render(Select)
    expect(q(container, 'value')?.textContent).toContain('Pick one')
  })

  it('has data-state="closed" on the trigger', () => {
    const { container } = render(Select)
    expect(q(container, 'trigger')?.getAttribute('data-state')).toBe('closed')
  })
})

describe('Select — opening / closing', () => {
  it('trigger tap opens (data-state="open" + items render)', async () => {
    const { container } = render(Select)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'trigger')?.getAttribute('data-state')).toBe('open')
    expect(q(container, 'item-Apple')).not.toBeNull()
    expect(q(container, 'item-Banana')).not.toBeNull()
  })

  it('second trigger tap toggles closed', async () => {
    const { container } = render(Select)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'trigger')?.getAttribute('data-state')).toBe('closed')
    expect(q(container, 'item-Apple')).toBeNull()
  })

  it('defaultOpen=true renders items immediately', () => {
    const { container } = render(Select, { defaultOpen: true })
    expect(q(container, 'item-Apple')).not.toBeNull()
  })
})

describe('Select — selection', () => {
  it('item tap selects + closes', async () => {
    const { container } = render(Select)
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    fireEvent.tap(q(container, 'item-Banana')!)
    await waitForUpdate()
    expect(q(container, 'model')?.textContent).toBe('Banana')
    expect(q(container, 'trigger')?.getAttribute('data-state')).toBe('closed')
  })

  it('selected item has data-state="checked"', async () => {
    const { container } = render(Select, { modelValue: 'Cherry', defaultOpen: true })
    expect(q(container, 'item-Cherry')?.getAttribute('data-state')).toBe('checked')
    expect(q(container, 'item-Apple')?.getAttribute('data-state')).toBe('unchecked')
  })

  it('SelectItemIndicator is rendered only for selected item', async () => {
    const { container } = render(Select, { modelValue: 'Cherry', defaultOpen: true })
    expect(q(container, 'indicator-Cherry')).not.toBeNull()
    expect(q(container, 'indicator-Apple')).toBeNull()
    expect(q(container, 'indicator-Banana')).toBeNull()
  })
})

describe('Select — disabled', () => {
  it('disabled root does not open on tap', async () => {
    const { container } = render(Select, { disabled: true })
    fireEvent.tap(q(container, 'trigger')!)
    await waitForUpdate()
    expect(q(container, 'trigger')?.getAttribute('data-state')).toBe('closed')
    expect(q(container, 'trigger')?.getAttribute('data-disabled')).toBe('')
  })

  it('disabled item does not select on tap', async () => {
    const { container } = render(Select, { itemDisabled: 'Banana', defaultOpen: true })
    fireEvent.tap(q(container, 'item-Banana')!)
    await waitForUpdate()
    expect(q(container, 'model')?.textContent).toBe('')
    expect(q(container, 'item-Banana')?.getAttribute('data-disabled')).toBe('')
  })
})

describe('Select — external v-model', () => {
  it('initial modelValue is reflected in the slot model after mount', async () => {
    const { container } = render(Select, { modelValue: 'Apple' })
    await waitForUpdate()
    expect(q(container, 'model')?.textContent).toBe('Apple')
  })

  it('selecting another item updates the model', async () => {
    const { container } = render(Select, { modelValue: 'Apple', defaultOpen: true })
    fireEvent.tap(q(container, 'item-Cherry')!)
    await waitForUpdate()
    expect(q(container, 'model')?.textContent).toBe('Cherry')
  })
})
