import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import PinInput from './story/_PinInput.vue'

function inputAt(container: Element, index: number) {
  return container.querySelector(`[data-testid="cell-${index}"]`) as Element
}

function inputValue(container: Element, value: string, index: number) {
  fireEvent.input(inputAt(container, index), { detail: { value } })
}

function readState(container: Element) {
  const text = container.querySelector('[data-testid="value"]')?.textContent ?? '[]'
  return JSON.parse(text) as string[]
}

describe('PinInput — rendering', () => {
  it('renders one input per index', () => {
    const { container } = render(PinInput, { length: 5 })
    expect(container.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(5)
  })

  it('uses the configured placeholder', () => {
    const { container } = render(PinInput, { placeholder: '*' })
    expect(inputAt(container, 0).getAttribute('placeholder')).toBe('*')
  })

  it('cells are maxlength="1"', () => {
    const { container } = render(PinInput)
    expect(inputAt(container, 0).getAttribute('maxlength')).toBe('1')
  })

  it('default type is text', () => {
    const { container } = render(PinInput)
    expect(inputAt(container, 0).getAttribute('type')).toBe('text')
  })

  it('mask=true renders password fields', () => {
    const { container } = render(PinInput, { mask: true })
    expect(inputAt(container, 0).getAttribute('type')).toBe('password')
  })

  it('type="number" renders Lynx digit input fields', () => {
    // PinInput maps the public `type="number"` prop to the Lynx `digit`
    // input mode — the on-screen numeric keypad.
    const { container } = render(PinInput, { type: 'number' })
    expect(inputAt(container, 0).getAttribute('type')).toBe('digit')
  })

  it('disabled root sets data-disabled on root and inputs', () => {
    const { container } = render(PinInput, { disabled: true })
    expect(container.querySelector('[data-testid="root"]')?.getAttribute('data-disabled')).toBe('')
    expect(inputAt(container, 0).getAttribute('data-disabled')).toBe('')
  })
})

describe('PinInput — input handling', () => {
  it('typing into a cell updates the indexed value', async () => {
    const { container } = render(PinInput)
    inputValue(container, '5', 0)
    await waitForUpdate()
    expect(readState(container)).toEqual(['5'])
  })

  it('typing into the second cell sets index 1', async () => {
    const { container } = render(PinInput)
    inputValue(container, '7', 1)
    await waitForUpdate()
    expect(readState(container)[1]).toBe('7')
  })

  it('numeric mode rejects non-digit input', async () => {
    const { container } = render(PinInput, { type: 'number' })
    inputValue(container, 'a', 0)
    await waitForUpdate()
    expect(readState(container)[0] ?? '').toBe('')
  })

  it('numeric mode accepts digits', async () => {
    const { container } = render(PinInput, { type: 'number' })
    inputValue(container, '9', 0)
    await waitForUpdate()
    expect(readState(container)[0]).toBe('9')
  })

  it('multi-char input spreads across cells starting at the focused index', async () => {
    const { container } = render(PinInput, { length: 4 })
    inputValue(container, '1234', 0)
    await waitForUpdate()
    expect(readState(container)).toEqual(['1', '2', '3', '4'])
  })

  it('multi-char input past the last cell drops the overflow', async () => {
    const { container } = render(PinInput, { length: 4 })
    inputValue(container, '12345678', 0)
    await waitForUpdate()
    expect(readState(container)).toEqual(['1', '2', '3', '4'])
  })

  it('multi-char input from index 2 fills only the remaining cells', async () => {
    const { container } = render(PinInput, { length: 4 })
    inputValue(container, 'ABCDEFG', 2)
    await waitForUpdate()
    const state = readState(container)
    expect(state[2]).toBe('A')
    expect(state[3]).toBe('B')
  })

  it('numeric multi-char input strips non-digits', async () => {
    const { container } = render(PinInput, { length: 4, type: 'number' })
    inputValue(container, '1a2b3c4', 0)
    await waitForUpdate()
    expect(readState(container)).toEqual(['1', '2', '3', '4'])
  })
})

describe('PinInput — completion', () => {
  it('does not emit complete while any cell is empty', async () => {
    const { container } = render(PinInput, { length: 3 })
    await waitForUpdate()
    inputValue(container, '1', 0)
    inputValue(container, '2', 1)
    await waitForUpdate()
    const completeText = container.querySelector('[data-testid="last-complete"]')?.textContent ?? 'null'
    expect(JSON.parse(completeText)).toBeNull()
  })
})

describe('PinInput — external v-model', () => {
  it('honours an initial modelValue', () => {
    const { container } = render(PinInput, { modelValue: ['1', '2', '3', '4'], length: 4 })
    expect(readState(container)).toEqual(['1', '2', '3', '4'])
  })
})
