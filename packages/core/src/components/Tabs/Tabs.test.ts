// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Tabs from './story/_Tabs.vue'

describe('given default Tabs', () => {
  let container: Element

  beforeEach(() => {
    ;({ container } = render(Tabs))
  })

  it('should render first tab content by default', () => {
    expect(container.innerHTML).toContain('Make changes')
  })

  describe('after tapping the second tab trigger', () => {
    beforeEach(async () => {
      const triggers = container.querySelectorAll('[accessibility-traits="button"]')
      fireEvent.tap(triggers[1])
      await waitForUpdate()
    })

    it('should show second tab content', () => {
      expect(container.innerHTML).toContain('Change your password')
    })

    it('should hide first tab content', () => {
      expect(container.innerHTML).not.toContain('Make changes')
    })
  })
})
