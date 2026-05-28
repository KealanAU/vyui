// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Stepper from './story/_Stepper.vue'

describe('given a Stepper', () => {
  it('should render', () => {
    const { container } = render(Stepper)
    expect(container.querySelector('[data-testid="stepper"]')).not.toBeNull()
  })

  it('respects a default modelValue if provided', () => {
    const { container } = render(Stepper, { stepperProps: { modelValue: 2 } })
    expect(container.querySelector('[data-testid="stepper-item-2"]')?.getAttribute('data-state')).toBe('active')
  })

  it('selects a step on tap', async () => {
    const { container } = render(Stepper)
    fireEvent.tap(container.querySelector('[data-testid="stepper-item-trigger-2"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="stepper-item-2"]')?.getAttribute('data-state')).toBe('active')
  })

  it('prevents selecting a future step when linear', async () => {
    const { container } = render(Stepper, { stepperProps: { linear: true } })
    fireEvent.tap(container.querySelector('[data-testid="stepper-item-trigger-3"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="stepper-item-3"]')?.getAttribute('data-state')).not.toBe('active')
    expect(container.querySelector('[data-testid="stepper-item-1"]')?.getAttribute('data-state')).toBe('active')
  })

  it('allows selecting any step when non-linear', async () => {
    const { container } = render(Stepper, { stepperProps: { linear: false } })
    fireEvent.tap(container.querySelector('[data-testid="stepper-item-trigger-3"]')!)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="stepper-item-3"]')?.getAttribute('data-state')).toBe('active')
  })
})
