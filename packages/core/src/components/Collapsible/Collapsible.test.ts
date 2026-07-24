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
    trigger = container.querySelector('[data-testid="trigger"]')!
  })

  it('hides the content', () => {
    expect(container.innerHTML).not.toContain(CONTENT_TEXT)
  })

  describe('when tapping the trigger', () => {
    beforeEach(async () => {
      fireEvent.tap(trigger)
      await waitForUpdate()
    })

    it('opens the content', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    describe('and tapping the trigger again', () => {
      beforeEach(async () => {
        fireEvent.tap(trigger)
        await waitForUpdate()
      })

      it('closes the content', () => {
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
    trigger = container.querySelector('[data-testid="trigger"]')!
  })

  it('sets the hidden attribute on the content while closed', () => {
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

    it('opens the content', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    describe('and tapping the trigger again', () => {
      beforeEach(async () => {
        fireEvent.tap(trigger)
        await waitForUpdate()
      })

      it('keeps the content mounted with data-state=closed + hidden', () => {
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

describe('given a keep-mounted Collapsible (height morph)', () => {
  it('collapses the content to height:0 while closed', async () => {
    const { container } = render(Collapsible, { unmountOnHide: false })
    await waitForUpdate()
    const content = container.querySelector('[hidden]')!
    expect(content).not.toBeNull()
    expect(content.getAttribute('style') ?? '').toContain('height: 0px')
  })

  it('tweens to the measured natural height on open', async () => {
    const { container } = render(Collapsible, { unmountOnHide: false })
    await waitForUpdate()
    const content = container.querySelector('[hidden]')!
    const contentId = content.id
    // The inner wrapper reports its natural height via @layoutchange; the outer
    // container then animates to that concrete px value.
    fireEvent.layoutchange(content.firstElementChild!, { detail: { height: 120 } })
    fireEvent.tap(container.querySelector('[data-testid="trigger"]')!)
    await waitForUpdate()
    const open = container.querySelector(`#${contentId}`)!
    expect(open.getAttribute('style') ?? '').toContain('height: 120px')
    expect(open.hasAttribute('hidden')).toBe(false)
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

    it('shows the content by default', () => {
      expect(container.innerHTML).toContain(CONTENT_TEXT)
    })

    it('closes the content on tap', async () => {
      const trigger = container.querySelector('[data-testid="trigger"]')!
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(container.innerHTML).not.toContain(CONTENT_TEXT)
    })

    it('emits update:open with false on close', async () => {
      const trigger = container.querySelector('[data-testid="trigger"]')!
      fireEvent.tap(trigger)
      await waitForUpdate()
      expect(onUpdateOpen).toHaveBeenCalledWith(false)
    })
  })
})
