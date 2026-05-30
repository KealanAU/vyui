// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import ToggleGroup from './story/_ToggleGroup.vue'

describe('given default Toggle Group', () => {
  let container: Element
  let triggers: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(ToggleGroup, { defaultValue: 'center' }))
    triggers = container.querySelectorAll('[data-testid="toggle-item"]')
  })

  it('should have active toggle=center', () => {
    expect(triggers[0].getAttribute('data-state')).toBe('off')
    expect(triggers[1].getAttribute('data-state')).toBe('on')
    expect(triggers[2].getAttribute('data-state')).toBe('off')
  })

  describe('after tapping the current active', () => {
    beforeEach(async () => {
      fireEvent.tap(triggers[1])
      await waitForUpdate()
    })

    it('should deselect the pre-existing value', () => {
      expect(triggers[0].getAttribute('data-state')).toBe('off')
      expect(triggers[1].getAttribute('data-state')).toBe('off')
      expect(triggers[2].getAttribute('data-state')).toBe('off')
    })
  })

  describe('after tapping a different toggle', () => {
    beforeEach(async () => {
      fireEvent.tap(triggers[2])
      await waitForUpdate()
    })

    it('should activate the tapped toggle', () => {
      expect(triggers[0].getAttribute('data-state')).toBe('off')
      expect(triggers[1].getAttribute('data-state')).toBe('off')
      expect(triggers[2].getAttribute('data-state')).toBe('on')
    })
  })
})

describe('given multiple value Toggle Group', () => {
  let container: Element
  let triggers: NodeListOf<Element>

  beforeEach(() => {
    ;({ container } = render(ToggleGroup, { type: 'multiple', defaultValue: ['center', 'right'] }))
    triggers = container.querySelectorAll('[data-testid="toggle-item"]')
  })

  it('should have active toggles for center and right', () => {
    expect(triggers[0].getAttribute('data-state')).toBe('off')
    expect(triggers[1].getAttribute('data-state')).toBe('on')
    expect(triggers[2].getAttribute('data-state')).toBe('on')
  })

  describe('after tapping an active toggle', () => {
    beforeEach(async () => {
      fireEvent.tap(triggers[2])
      await waitForUpdate()
    })

    it('should deactivate that toggle', () => {
      expect(triggers[0].getAttribute('data-state')).toBe('off')
      expect(triggers[1].getAttribute('data-state')).toBe('on')
      expect(triggers[2].getAttribute('data-state')).toBe('off')
    })
  })

  describe('after tapping an inactive toggle', () => {
    beforeEach(async () => {
      fireEvent.tap(triggers[0])
      await waitForUpdate()
    })

    it('should activate that toggle', () => {
      expect(triggers[0].getAttribute('data-state')).toBe('on')
      expect(triggers[1].getAttribute('data-state')).toBe('on')
      expect(triggers[2].getAttribute('data-state')).toBe('on')
    })
  })
})
