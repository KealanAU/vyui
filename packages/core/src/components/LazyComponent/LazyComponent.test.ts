// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'

import Lazy from './story/_LazyComponent.vue'

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// NOTE: full exposure-event flow ('exposure' → show=true → mount children)
// requires a Lynx runtime providing `lynx.getJSModule('GlobalEventEmitter')`.
// Vitest provides no equivalent. Manual verification via LynxExplorer + the
// demo app; see plans/mobile-first-pivot.md §3L.

describe('LazyComponent — placeholder render', () => {
  it('renders a placeholder before any exposure event', async () => {
    const { container } = render(Lazy, { pid: 'a', scene: 'feed' })
    await waitForUpdate()
    expect(q(container, 'lazy')).not.toBeNull()
    // Children stay un-mounted until exposure fires.
    expect(q(container, 'loaded')).toBeNull()
  })

  it('placeholder carries the expected exposure attributes', async () => {
    const { container } = render(Lazy, { pid: 'a', scene: 'feed' })
    await waitForUpdate()
    const el = q(container, 'lazy')!
    expect(el.getAttribute('exposure-id')).toBe('a')
    expect(el.getAttribute('exposure-scene')).toBe('feed')
    expect(el.getAttribute('flatten')).toBe('false')
  })

  it('placeholder applies estimated style for layout reservation', async () => {
    const { container } = render(Lazy, { pid: 'a', scene: 'feed' })
    await waitForUpdate()
    const el = q(container, 'lazy')!
    const style = el.getAttribute('style') ?? ''
    expect(style).toContain('width: 100%')
    expect(style).toContain('height: 120px')
  })

  it('placeholder applies custom margin attrs', async () => {
    // Re-render via story (story only forwards pid/scene/unmountOnExit).
    // Default margins come from the component prop defaults.
    const { container } = render(Lazy, { pid: 'a', scene: 'feed' })
    await waitForUpdate()
    const el = q(container, 'lazy')!
    expect(el.getAttribute('exposure-screen-margin-top')).toBe('10px')
    expect(el.getAttribute('exposure-screen-margin-bottom')).toBe('10px')
  })
})

describe('LazyComponent — exports', () => {
  it('exports LazyComponent', async () => {
    const mod = await import('.')
    expect(mod.LazyComponent).toBeDefined()
  })
})
