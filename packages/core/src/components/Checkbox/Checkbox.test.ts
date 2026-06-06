// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Checkbox from './story/_Checkbox.vue'
import CheckboxGroup from './story/_CheckboxGroup.vue'

describe('given a default Checkbox', () => {
  it('renders', () => {
    const { container } = render(Checkbox)
    expect(container.querySelector('[data-testid="checkbox"]')).not.toBeNull()
  })

  it('sets accessibility-traits to button', () => {
    const { container } = render(Checkbox)
    expect(container.querySelector('[accessibility-traits="button"]')).not.toBeNull()
  })

  describe('when tapping the checkbox', () => {
    let container: Element
    let checkbox: Element

    beforeEach(async () => {
      ;({ container } = render(Checkbox))
      checkbox = container.querySelector('[data-testid="checkbox"]')!
      fireEvent.tap(checkbox)
      await waitForUpdate()
    })

    it('shows checked state', () => {
      expect(checkbox.getAttribute('data-state')).toBe('checked')
    })

    describe('when tapping again', () => {
      beforeEach(async () => {
        fireEvent.tap(checkbox)
        await waitForUpdate()
      })
      it('shows unchecked state', () => {
        expect(checkbox.getAttribute('data-state')).toBe('unchecked')
      })
    })
  })
})

describe('given CheckboxGroup', () => {
  it('renders', () => {
    const { container } = render(CheckboxGroup)
    expect(container.querySelectorAll('[data-testid="checkbox"]').length).toBeGreaterThan(0)
  })

  describe('when tapping a checkbox', () => {
    let container: Element
    let checkboxes: NodeListOf<Element>

    beforeEach(async () => {
      ;({ container } = render(CheckboxGroup))
      checkboxes = container.querySelectorAll('[data-testid="checkbox"]')
      fireEvent.tap(checkboxes[0])
      await waitForUpdate()
    })

    it('marks the first checkbox checked', () => {
      expect(checkboxes[0].getAttribute('data-state')).toBe('checked')
    })

    describe('when tapping again', () => {
      beforeEach(async () => {
        fireEvent.tap(checkboxes[0])
        await waitForUpdate()
      })
      it('unchecks the checkbox', () => {
        expect(checkboxes[0].getAttribute('data-state')).toBe('unchecked')
      })
    })

    describe('when tapping another checkbox', () => {
      beforeEach(async () => {
        fireEvent.tap(checkboxes[1])
        await waitForUpdate()
      })

      it('keeps both checkboxes checked', () => {
        expect(checkboxes[0].getAttribute('data-state')).toBe('checked')
        expect(checkboxes[1].getAttribute('data-state')).toBe('checked')
        expect(checkboxes[2].getAttribute('data-state')).toBe('unchecked')
      })
    })
  })
})

describe('given a disabled Checkbox', () => {
  let container: Element
  let checkbox: Element

  beforeEach(() => {
    ;({ container } = render(Checkbox, { disabled: true }))
    // A disabled checkbox's accessibility-traits is "disabled", not "button";
    // select by the stable data-disabled marker instead.
    checkbox = container.querySelector('[data-disabled]')!
  })

  describe('when tapping', () => {
    beforeEach(async () => {
      fireEvent.tap(checkbox)
      await waitForUpdate()
    })
    it('remains unchecked', () => {
      expect(checkbox.getAttribute('data-state')).toBe('unchecked')
    })
  })
})

describe('given value as "indeterminate"', () => {
  let container: Element
  let checkbox: Element

  beforeEach(() => {
    ;({ container } = render(Checkbox, { modelValue: 'indeterminate' }))
    checkbox = container.querySelector('[data-testid="checkbox"]')!
  })

  it('has data-state "indeterminate"', () => {
    expect(checkbox.getAttribute('data-state')).toBe('indeterminate')
  })

  it('becomes checked after tap', async () => {
    fireEvent.tap(checkbox)
    await waitForUpdate()
    expect(checkbox.getAttribute('data-state')).toBe('checked')
  })
})

describe('given checkbox v-model', () => {
  it('reflects modelValue changes', async () => {
    const { container } = render(Checkbox)
    const checkbox = container.querySelector('[data-testid="checkbox"]')!
    expect(checkbox.getAttribute('data-state')).toBe('unchecked')
    fireEvent.tap(checkbox)
    await waitForUpdate()
    expect(checkbox.getAttribute('data-state')).toBe('checked')
    fireEvent.tap(checkbox)
    await waitForUpdate()
    expect(checkbox.getAttribute('data-state')).toBe('unchecked')
  })
})
