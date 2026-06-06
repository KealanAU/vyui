// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Switch from './_Switch.vue'

describe('Switch', () => {
  it('renders the thumb', () => {
    const { container } = render(Switch)
    expect(container.querySelector('[data-testid="thumb"]')).not.toBeNull()
  })

  it('toggles value on root tap', async () => {
    const { container } = render(Switch)
    const root = container.querySelector('[data-testid="root"]')!

    expect(container.innerHTML).toContain('unchecked')

    fireEvent.tap(root)
    await waitForUpdate()
    expect(container.innerHTML).not.toContain('unchecked')
    expect(container.innerHTML).toContain('checked')

    fireEvent.tap(root)
    await waitForUpdate()
    expect(container.innerHTML).toContain('unchecked')
  })
})
