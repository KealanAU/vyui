import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Combobox from './story/_Combobox.vue'
import ComboboxObject from './story/_ComboboxObject.vue'

function getTrigger(container: Element) {
  return container.querySelector('[accessibility-traits="button"][accessibility-label="Show options"]')!
}

function getInput(container: Element) {
  return container.querySelector('input')!
}

function getItems(container: Element) {
  return Array.from(container.querySelectorAll('[data-combobox-item]'))
}

function getGroup(container: Element) {
  return container.querySelector('[data-combobox-group]')
}

describe('given default Combobox', () => {
  it('should show placeholder', () => {
    const { container } = render(Combobox)
    expect(getInput(container).getAttribute('placeholder')).toBe('Placeholder...')
  })

  it('should not show the popup content initially', () => {
    const { container } = render(Combobox)
    expect(getGroup(container)).toBeNull()
  })

  describe('opening the popup', () => {
    it('should show the popup content', async () => {
      const { container } = render(Combobox)
      fireEvent.tap(getTrigger(container))
      await waitForUpdate()
      expect(getGroup(container)).not.toBeNull()
      expect(container.textContent).toContain('Apple')
    })

    it('should mark the trigger as open', async () => {
      const { container } = render(Combobox)
      const trigger = getTrigger(container)
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(trigger.getAttribute('data-state')).toBe('open')
    })

    it('should render all items', async () => {
      const { container } = render(Combobox)
      fireEvent.tap(getTrigger(container))
      await waitForUpdate()
      expect(getItems(container).length).toBe(5)
    })

    it('should close the popup on second trigger tap', async () => {
      const { container } = render(Combobox)
      const trigger = getTrigger(container)
      fireEvent.tap(trigger)
      await waitForUpdate()
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(getGroup(container)).toBeNull()
    })

    describe('after selecting a value', () => {
      it('should close the popup', async () => {
        const { container } = render(Combobox)
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        fireEvent.tap(getItems(container)[1]!)
        await waitForUpdate()
        expect(getGroup(container)).toBeNull()
      })

      it('should reflect the selected value in the input', async () => {
        const { container } = render(Combobox)
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        fireEvent.tap(getItems(container)[1]!)
        await waitForUpdate()
        expect(getInput(container).getAttribute('value')).toBe('Banana')
      })

      it('should mark the selected item as checked when reopened', async () => {
        const { container } = render(Combobox)
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        fireEvent.tap(getItems(container)[1]!)
        await waitForUpdate()
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        const items = getItems(container)
        expect(items[1]!.getAttribute('data-state')).toBe('checked')
      })
    })

    describe('filtering', () => {
      it('should filter items by the input value', async () => {
        const { container } = render(Combobox)
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        const input = getInput(container)
        fireEvent.input(input, { detail: { value: 'Ban' } })
        await waitForUpdate()
        const items = getItems(container)
        expect(items.length).toBe(1)
        expect(items[0]!.textContent).toContain('Banana')
      })

      it('should open the popup when typing while closed', async () => {
        const { container } = render(Combobox)
        const input = getInput(container)
        fireEvent.input(input, { detail: { value: 'Gr' } })
        await waitForUpdate()
        expect(getGroup(container)).not.toBeNull()
      })

      it('should show ComboboxEmpty when no items match', async () => {
        const { container } = render(Combobox)
        fireEvent.tap(getTrigger(container))
        await waitForUpdate()
        fireEvent.input(getInput(container), { detail: { value: 'zzz' } })
        await waitForUpdate()
        expect(container.querySelector('[data-combobox-empty]')).not.toBeNull()
        expect(getItems(container).length).toBe(0)
      })
    })
  })

  describe('disabled', () => {
    it('should not open when disabled', async () => {
      const { container } = render(Combobox, { disabled: true })
      fireEvent.tap(getTrigger(container))
      await waitForUpdate()
      expect(getGroup(container)).toBeNull()
    })
  })

  describe('ignoreFilter', () => {
    it('should not filter items when ignoreFilter is true', async () => {
      const { container } = render(Combobox, { ignoreFilter: true })
      fireEvent.tap(getTrigger(container))
      await waitForUpdate()
      fireEvent.input(getInput(container), { detail: { value: 'Ban' } })
      await waitForUpdate()
      expect(getItems(container).length).toBe(5)
    })
  })
})

describe('given a Combobox with multiple prop', () => {
  it('should keep the popup open after selecting', async () => {
    const { container } = render(Combobox, { multiple: true })
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[1]!)
    await waitForUpdate()
    expect(getGroup(container)).not.toBeNull()
  })

  it('should mark selected items checked and allow multiple selections', async () => {
    const { container } = render(Combobox, { multiple: true })
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[0]!)
    await waitForUpdate()
    fireEvent.tap(getItems(container)[2]!)
    await waitForUpdate()
    const items = getItems(container)
    expect(items[0]!.getAttribute('data-state')).toBe('checked')
    expect(items[2]!.getAttribute('data-state')).toBe('checked')
  })

  it('should deselect an item when tapped again', async () => {
    const { container } = render(Combobox, { multiple: true })
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[0]!)
    await waitForUpdate()
    fireEvent.tap(getItems(container)[0]!)
    await waitForUpdate()
    expect(getItems(container)[0]!.getAttribute('data-state')).toBe('unchecked')
  })

  it('should not reflect a value in the input in multiple mode', async () => {
    const { container } = render(Combobox, { multiple: true })
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[1]!)
    await waitForUpdate()
    expect(getInput(container).getAttribute('value') ?? '').toBe('')
  })
})

describe('given a Combobox with object values', () => {
  it('should show the popup content', async () => {
    const { container } = render(ComboboxObject)
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    expect(container.textContent).toContain('Durward Reynolds')
  })

  it('should filter object items by textValue', async () => {
    const { container } = render(ComboboxObject)
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.input(getInput(container), { detail: { value: 'Du' } })
    await waitForUpdate()
    const items = getItems(container)
    expect(items.length).toBe(1)
    expect(items[0]!.textContent).toContain('Durward')
  })

  it('should close the popup after selecting when no displayValue provided', async () => {
    const { container } = render(ComboboxObject)
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[1]!)
    await waitForUpdate()
    expect(getItems(container).length).toBe(0)
  })

  it('should show the displayValue text in the input when provided', async () => {
    const { container } = render(ComboboxObject, {
      displayValue: (item: any) => (item ? item.name : ''),
    })
    fireEvent.tap(getTrigger(container))
    await waitForUpdate()
    fireEvent.tap(getItems(container)[1]!)
    await waitForUpdate()
    expect(getInput(container).getAttribute('value')).toBe('Kenton Towne')
  })
})
