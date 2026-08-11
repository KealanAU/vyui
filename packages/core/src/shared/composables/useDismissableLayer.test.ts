import { describe, expect, it, vi } from 'vitest'
import { useDismissableLayer } from './useDismissableLayer'

describe('useDismissableLayer', () => {
  describe('onInteractOutside', () => {
    it('emits pointerDownOutside then interactOutside, in that order', () => {
      const emit = vi.fn()
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss: () => {} })

      onInteractOutside({ some: 'event' })

      expect(emit).toHaveBeenCalledTimes(2)
      expect(emit.mock.calls[0][0]).toBe('pointerDownOutside')
      expect(emit.mock.calls[1][0]).toBe('interactOutside')
    })

    it('passes the same event object (and original event) to both emits', () => {
      const emit = vi.fn()
      const originalEvent = { tag: 'tap' }
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss: () => {} })

      onInteractOutside(originalEvent)

      const pointerDownEvent = emit.mock.calls[0][1]
      const interactEvent = emit.mock.calls[1][1]
      expect(pointerDownEvent).toBe(interactEvent)
      expect(pointerDownEvent.originalEvent).toBe(originalEvent)
    })

    it('calls onDismiss when neither handler prevents default', () => {
      const emit = vi.fn()
      const onDismiss = vi.fn()
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss })

      onInteractOutside()

      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('does not call onDismiss when pointerDownOutside calls preventDefault()', () => {
      const onDismiss = vi.fn()
      const emit = vi.fn((name: string, event: any) => {
        if (name === 'pointerDownOutside')
          event.preventDefault()
      })
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss })

      onInteractOutside()

      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('does not call onDismiss when interactOutside calls preventDefault()', () => {
      const onDismiss = vi.fn()
      const emit = vi.fn((name: string, event: any) => {
        if (name === 'interactOutside')
          event.preventDefault()
      })
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss })

      onInteractOutside()

      expect(onDismiss).not.toHaveBeenCalled()
    })

    it('exposes defaultPrevented as false until preventDefault() is invoked', () => {
      const emit = vi.fn()
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss: () => {} })

      onInteractOutside()

      const event = emit.mock.calls[0][1]
      expect(event.defaultPrevented).toBe(false)
    })

    it('works with no originalEvent argument', () => {
      const emit = vi.fn()
      const { onInteractOutside } = useDismissableLayer({ emit, onDismiss: () => {} })

      onInteractOutside()

      expect(emit.mock.calls[0][1].originalEvent).toBeUndefined()
    })
  })
})
