import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import _NumberField from './story/_NumberField.vue'

function input(container: Element) {
  return container.querySelector('[data-testid="input"]') as Element
}
function increment(container: Element) {
  return container.querySelector('[data-testid="increment"]') as Element
}
function decrement(container: Element) {
  return container.querySelector('[data-testid="decrement"]') as Element
}

function inputText(container: Element) {
  return input(container).getAttribute('value') ?? ''
}

function readValue(container: Element) {
  const text = container.querySelector('[data-testid="value"]')?.textContent ?? 'null'
  return JSON.parse(text) as number | null
}

function type(container: Element, value: string) {
  fireEvent.input(input(container), { detail: { value } })
}

describe('NumberField — increment / decrement', () => {
  it('increment adds step from the current value', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 2, step: 1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(3)
  })

  it('decrement subtracts step from the current value', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 2, step: 1 })
    fireEvent.tap(decrement(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(1)
  })

  it('increment honors a custom step', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, step: 5 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(5)
  })

  it('increment from an empty field starts at 0 + step (unbounded)', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: null, step: 1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(1)
  })
})

describe('NumberField — clamping at min / max', () => {
  it('increment clamps at max', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 10, max: 10, step: 1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(10)
  })

  it('decrement clamps at min', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, step: 1 })
    fireEvent.tap(decrement(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(0)
  })

  it('typed value above max snaps down on commit', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, max: 5, step: 1 })
    type(container, '99')
    await waitForUpdate()
    expect(readValue(container)).toBe(5)
  })

  it('typed value below min snaps up on commit', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: -5, max: 100, step: 1 })
    type(container, '-99')
    await waitForUpdate()
    expect(readValue(container)).toBe(-5)
  })

  it('increment button is data-disabled at max', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 10, max: 10 })
    expect(increment(container).getAttribute('data-disabled')).toBe('')
  })

  it('decrement button is data-disabled at min', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0 })
    expect(decrement(container).getAttribute('data-disabled')).toBe('')
  })

  it('increment button is not disabled below max', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 5, max: 10 })
    expect(increment(container).getAttribute('data-disabled')).toBeNull()
  })
})

describe('NumberField — step snapping', () => {
  it('snaps a typed value to the nearest step', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, max: 100, step: 5 })
    type(container, '7')
    await waitForUpdate()
    expect(readValue(container)).toBe(5)
  })

  it('snaps up when nearer the upper step', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, max: 100, step: 5 })
    type(container, '8')
    await waitForUpdate()
    expect(readValue(container)).toBe(10)
  })
})

describe('NumberField — decimal precision', () => {
  it('preserves a fractional step result', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, max: 1, step: 0.1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(0.1)
  })

  it('does not accumulate floating point error across increments', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, max: 1, step: 0.1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    fireEvent.tap(increment(container))
    await waitForUpdate()
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(0.3)
  })

  it('snaps a typed fractional value to the step grid', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, max: 10, step: 0.5 })
    type(container, '1.3')
    await waitForUpdate()
    expect(readValue(container)).toBe(1.5)
  })
})

describe('NumberField — disabled / readonly', () => {
  it('disabled increment is a no-op', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 2, disabled: true })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(2)
  })

  it('readonly typing is a no-op', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 2, readonly: true })
    type(container, '9')
    await waitForUpdate()
    expect(readValue(container)).toBe(2)
  })

  it('disabled root sets data-disabled on root and buttons', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 2, disabled: true })
    expect(container.querySelector('[data-testid="root"]')?.getAttribute('data-disabled')).toBe('')
    expect(increment(container).getAttribute('data-disabled')).toBe('')
    expect(decrement(container).getAttribute('data-disabled')).toBe('')
  })
})

describe('NumberField — text input parsing', () => {
  it('parses a valid number', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: null, min: 0, max: 100 })
    type(container, '42')
    await waitForUpdate()
    expect(readValue(container)).toBe(42)
  })

  it('empty text commits null', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 5, min: 0, max: 100 })
    type(container, '')
    await waitForUpdate()
    expect(readValue(container)).toBeNull()
  })

  it('a lone "-" while typing does not commit a number', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: null, min: -10, max: 10 })
    type(container, '-')
    await waitForUpdate()
    expect(readValue(container)).toBeNull()
  })

  it('negative values are accepted when min < 0', async () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: null, min: -10, max: 10 })
    type(container, '-3')
    await waitForUpdate()
    expect(readValue(container)).toBe(-3)
  })

  it('renders a digit keypad for non-negative integer fields', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, step: 1 })
    expect(input(container).getAttribute('type')).toBe('digit')
  })

  it('renders a number keypad when negatives are allowed', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: -10, step: 1 })
    expect(input(container).getAttribute('type')).toBe('number')
  })

  it('renders a number keypad for fractional steps', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 0, min: 0, step: 0.5 })
    expect(input(container).getAttribute('type')).toBe('number')
  })
})

describe('NumberField — controlled vs uncontrolled', () => {
  it('controlled: reflects the bound value in the input', () => {
    const { container } = render(_NumberField, { controlled: true, modelValue: 7 })
    expect(inputText(container)).toBe('7')
  })

  it('uncontrolled: defaultValue seeds the input', () => {
    const { container } = render(_NumberField, { controlled: false, defaultValue: 4 })
    expect(inputText(container)).toBe('4')
  })

  it('uncontrolled: increment emits the next value', async () => {
    const { container } = render(_NumberField, { controlled: false, defaultValue: 4, step: 1 })
    fireEvent.tap(increment(container))
    await waitForUpdate()
    expect(readValue(container)).toBe(5)
  })
})
