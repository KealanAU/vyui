// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import { sleep } from '@/test'
import Progress from './story/_Progress.vue'
import ProgressStatic from './story/_ProgressStatic.vue'

describe('Progress', () => {
  it('renders the initial value in a loading state and updates over time', async () => {
    const { container } = render(Progress)
    expect(container.innerHTML).toContain('data-value="0"')
    expect(container.querySelector('[data-state]')!.getAttribute('data-state')).toBe('loading')

    await sleep(200)
    await waitForUpdate()
    expect(container.innerHTML).toContain('data-value="50"')
  })

  it('reflects max (default 100) and mirrors state/value onto the indicator', () => {
    const { container } = render(ProgressStatic, { value: 50 })
    const nodes = container.querySelectorAll('[data-state]')
    // both ProgressRoot and ProgressIndicator carry these attrs
    expect(nodes.length).toBeGreaterThanOrEqual(2)
    nodes.forEach((node) => {
      expect(node.getAttribute('data-state')).toBe('loading')
      expect(node.getAttribute('data-value')).toBe('50')
      expect(node.getAttribute('data-max')).toBe('100')
    })
  })

  it('is complete when value === max', () => {
    const { container } = render(ProgressStatic, { value: 100, max: 100 })
    expect(container.querySelector('[data-state]')!.getAttribute('data-state')).toBe('complete')
  })

  it('is indeterminate with no value when modelValue is null', () => {
    const { container } = render(ProgressStatic, { value: null })
    const root = container.querySelector('[data-state]')!
    expect(root.getAttribute('data-state')).toBe('indeterminate')
    expect(root.getAttribute('data-value')).toBeNull()
  })
})
