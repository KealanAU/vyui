// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import RadioGroup from './story/_RadioGroup.vue'

describe('default RadioGroup', () => {
  let container: Element
  let radios: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(RadioGroup))
    radios = container.querySelectorAll('[accessibility-role-description="radio"]')
  })

  it('checks the first item by default', () => {
    expect(radios[0].getAttribute('data-state')).toBe('checked')
  })

  it('renders an indicator inside the radio', () => {
    expect(radios[0].children.length).toBeGreaterThan(0)
  })
})

describe('disabled RadioGroup', () => {
  let container: Element
  let radios: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(RadioGroup, { disabled: true }))
    radios = container.querySelectorAll('[accessibility-role-description="radio"]')
  })

  it('checks the first item by default', () => {
    expect(radios[0].getAttribute('data-state')).toBe('checked')
  })

  it.each([[0, 'checked'], [1, 'unchecked'], [2, 'unchecked']])('does not change state on tap', async (input, output) => {
    fireEvent.tap(radios[input as number])
    await waitForUpdate()
    expect(radios[input as number].getAttribute('data-state')).toBe(output)
  })

  it.each([[0], [1], [2]])('sets the disabled attribute on each item', (input) => {
    expect(radios[input as number].getAttribute('disabled')).toBe('')
    expect(radios[input as number].getAttribute('data-disabled')).toBe('')
  })
})
