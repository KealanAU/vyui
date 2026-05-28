// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import RadioGroup from './story/_RadioGroup.vue'

describe('given a default RadioGroup', () => {
  let container: Element
  let radios: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(RadioGroup))
    radios = container.querySelectorAll('[accessibility-traits="button"]')
  })

  it('should have default selected', () => {
    expect(radios[0].getAttribute('data-state')).toBe('checked')
  })

  it('should render indicator inside radio', () => {
    expect(radios[0].children.length).toBeGreaterThan(0)
  })
})

describe('given disabled RadioGroup', () => {
  let container: Element
  let radios: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(RadioGroup, { disabled: true }))
    radios = container.querySelectorAll('[accessibility-traits="button"]')
  })

  it('should have default selected', () => {
    expect(radios[0].getAttribute('data-state')).toBe('checked')
  })

  it.each([[0, 'checked'], [1, 'unchecked'], [2, 'unchecked']])('should not change state on tap', async (input, output) => {
    fireEvent.tap(radios[input as number])
    await waitForUpdate()
    expect(radios[input as number].getAttribute('data-state')).toBe(output)
  })

  it.each([[0], [1], [2]])('should have disabled attribute on item', (input) => {
    expect(radios[input as number].getAttribute('disabled')).toBe('')
    expect(radios[input as number].getAttribute('data-disabled')).toBe('')
  })
})
