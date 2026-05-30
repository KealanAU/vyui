// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Rating from './story/_Rating.vue'
// _RatingEmit.vue forwards update:modelValue via useEmitAsProps — the base
// story's v-bind="props" does not forward $attrs event handlers to RatingRoot.
import RatingEmit from './story/_RatingEmit.vue'

// RatingItemIndicator: role 'option' → trait 'button' when enabled, 'disabled'
// when disabled.
const ITEM = '[accessibility-traits="button"]'
const activeCount = (root: Element, sel = ITEM) =>
  Array.from(root.querySelectorAll(sel)).filter(el => el.getAttribute('data-state') === 'active').length

describe('Rating', () => {
  it('renders `length` items', () => {
    const { container } = render(Rating, { length: 7 })
    expect(container.querySelectorAll(ITEM).length).toBe(7)
  })

  it('marks `defaultValue` items active and the rest inactive', () => {
    const { container } = render(Rating, { defaultValue: 3, length: 5 })
    expect(activeCount(container)).toBe(3)
  })

  it('renders one indicator per step (step=0.5 → 2 per item)', () => {
    const { container } = render(Rating, { length: 5, step: 0.5 })
    expect(container.querySelectorAll('[data-testid="rating-item"]').length).toBe(10)
  })

  it('emits the tapped value and marks it active', async () => {
    const onUpdate = vi.fn()
    const { container } = render(RatingEmit, { length: 5, 'onUpdate:modelValue': onUpdate })
    fireEvent.tap(container.querySelectorAll(ITEM)[2])
    await waitForUpdate()
    expect(onUpdate).toHaveBeenCalledWith(3)
    expect(container.querySelectorAll(ITEM)[2].getAttribute('data-state')).toBe('active')
  })

  it('clears to 0 when re-tapping the current value (clearable)', async () => {
    const onUpdate = vi.fn()
    const { container } = render(RatingEmit, { defaultValue: 3, length: 5, clearable: true, 'onUpdate:modelValue': onUpdate })
    fireEvent.tap(container.querySelectorAll(ITEM)[2])
    await waitForUpdate()
    expect(onUpdate).toHaveBeenCalledWith(0)
  })

  it('blocks interaction and sets data-disabled when disabled', async () => {
    const onUpdate = vi.fn()
    const { container } = render(RatingEmit, { defaultValue: 1, length: 3, disabled: true, 'onUpdate:modelValue': onUpdate })
    expect(container.querySelector('[data-disabled]')!.getAttribute('data-disabled')).toBe('')
    fireEvent.tap(container.querySelectorAll('[disabled=""]')[1])
    await waitForUpdate()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('reflects a controlled modelValue', () => {
    const { container } = render(Rating, { modelValue: 4, length: 5 })
    expect(activeCount(container)).toBe(4)
  })

  it('sets data-orientation on the root', () => {
    const { container } = render(Rating, { orientation: 'vertical' })
    expect(container.querySelector('[data-orientation="vertical"]')).not.toBeNull()
  })
})
