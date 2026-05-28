// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'

import Button from './story/_Button.vue'

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

describe('Button — render', () => {
  it('renders with the idle state in the scoped slot', async () => {
    const { container } = render(Button)
    await waitForUpdate()
    expect(q(container, 'btn')).not.toBeNull()
    expect(q(container, 'idle')).not.toBeNull()
    expect(q(container, 'active')).toBeNull()
  })

  it('exposes data-state="inactive" by default', async () => {
    const { container } = render(Button)
    await waitForUpdate()
    expect(q(container, 'btn')?.getAttribute('data-state')).toBe('inactive')
  })

  it('marks data-disabled when disabled', async () => {
    const { container } = render(Button, { disabled: true })
    await waitForUpdate()
    expect(q(container, 'btn')?.getAttribute('data-disabled')).toBe('')
    expect(q(container, 'idle')?.getAttribute('data-disabled')).toBe('true')
  })
})

describe('Button — exports', () => {
  it('exports Button + ButtonContext', async () => {
    const mod = await import('.')
    expect(mod.Button).toBeDefined()
    expect(mod.injectButtonContext).toBeDefined()
  })
})
