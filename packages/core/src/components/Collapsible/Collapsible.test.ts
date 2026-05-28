// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Collapsible from './story/_Collapsible.vue'

const CONTENT_TEXT = 'Content'

describe('given a default Collapsible', () => {
  let container: Element
  let trigger: Element

  beforeEach(() => {
    ;({ container } = render(Collapsible))
    trigger = container.querySelector('[accessibility-traits="button"]')!
  })

  it('should have hidden content', () => {
    expect(container.innerHTML).not.toContain(CONTENT_TEXT)
  })

  describe('when tapping the trigger', () => {
    beforeEach(async () => {
      fireEvent.tap(trigger)
      await waitForUpdate()
    })

    it('should open the content', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    describe('and tapping the trigger again', () => {
      beforeEach(async () => {
        fireEvent.tap(trigger)
        await waitForUpdate()
      })

      it('should close the content', () => {
        expect(container.innerHTML).not.toContain(CONTENT_TEXT)
      })
    })
  })
})

describe('given a Collapsible with `unmountOnHide:false`', () => {
  let container: Element
  let trigger: Element

  beforeEach(() => {
    ;({ container } = render(Collapsible, { unmountOnHide: false }))
    trigger = container.querySelector('[accessibility-traits="button"]')!
  })

  it('should have hidden attribute on the content while closed', () => {
    // CollapsibleContent now renders with `:hidden=""` when unmountOnHide is
    // false and the collapsible is closed — content stays mounted instead of
    // being v-if'd out.
    const content = container.querySelector('[hidden]')
    expect(content).not.toBeNull()
    expect(content!.getAttribute('hidden')).toBe('')
    // and the text is still in the tree
    expect(container.innerHTML).toContain(CONTENT_TEXT)
  })

  describe('when tapping the trigger', () => {
    beforeEach(async () => {
      fireEvent.tap(trigger)
      await waitForUpdate()
    })

    it('should open the content', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    describe('and tapping the trigger again', () => {
      beforeEach(async () => {
        fireEvent.tap(trigger)
        await waitForUpdate()
      })

      it('should keep the content mounted with data-state=closed + hidden', () => {
        // Re-query — the content node identity may have changed across the
        // open/close cycle, but a hidden node should be present.
        const content = container.querySelector('[hidden]')
        expect(content).not.toBeNull()
        expect(content!.getAttribute('data-state')).toBe('closed')
        expect(content!.getAttribute('hidden')).toBe('')
        expect(container.innerHTML).toContain(CONTENT_TEXT)
      })
    })
  })
})

describe('given an open uncontrolled Collapsible', () => {
  describe('when first rendered', () => {
    let container: Element
    let onUpdateOpen: ReturnType<typeof vi.fn>

    beforeEach(() => {
      onUpdateOpen = vi.fn()
      ;({ container } = render(Collapsible, { defaultOpen: true, 'onUpdate:open': onUpdateOpen }))
    })

    it('should show the content by default', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    it('should close the content on tap', async () => {
      const trigger = container.querySelector('[accessibility-traits="button"]')!
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(container.innerHTML).not.toContain(CONTENT_TEXT)
    })

    it('should emit update:open with false on close', async () => {
      const trigger = container.querySelector('[accessibility-traits="button"]')!
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(onUpdateOpen).toHaveBeenCalledWith(false)
    })
  })
})
