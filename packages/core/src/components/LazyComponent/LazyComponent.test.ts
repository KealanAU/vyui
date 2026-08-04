// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { render, waitForUpdate } from '@vyui/testing-utils'

import LazyComponent, { type LazyComponentProps } from './LazyComponent.vue'
import Lazy from './story/_LazyComponent.vue'

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

// The testing env owns the `lynx` global and its GlobalEventEmitter for the
// whole run — `exposure` is fed through the env's own emitter, exactly as Lynx
// delivers it (`emit(name, args)` spreads `args` over the listener).
function emitter(): { emit: (name: string, args?: unknown[]) => void, removeAllListeners: (name?: string) => void } {
  return (globalThis as any).lynx.getJSModule('GlobalEventEmitter')
}

// The story forwards only pid/scene/unmountOnExit — mount LazyComponent
// directly when the margin props or the slot content are what's under test.
function host(props: Partial<LazyComponentProps> = {}) {
  return defineComponent({
    setup: () => () => h('view', [
      h(
        LazyComponent,
        { scene: 'feed', pid: 'a', estimatedStyle: { width: '100%', height: '120px' }, ...props },
        { default: () => h('view', { 'data-testid': 'loaded' }) },
      ),
    ]),
  })
}

afterEach(() => emitter().removeAllListeners())

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

  it('placeholder applies the default margin attrs', async () => {
    const { container } = render(Lazy, { pid: 'a', scene: 'feed' })
    await waitForUpdate()
    const el = q(container, 'lazy')!
    expect(el.getAttribute('exposure-screen-margin-top')).toBe('10px')
    expect(el.getAttribute('exposure-screen-margin-bottom')).toBe('10px')
  })

  it('placeholder forwards custom margin props', async () => {
    const { container } = render(host({ top: '48px', bottom: '64px' }))
    await waitForUpdate()
    const el = container.querySelector('[exposure-id="a"]')!
    expect(el.getAttribute('exposure-screen-margin-top')).toBe('48px')
    expect(el.getAttribute('exposure-screen-margin-bottom')).toBe('64px')
  })
})

describe('LazyComponent — exposure', () => {
  it('mounts the children once an exposure event names its scene + id', async () => {
    const { container } = render(host())
    await waitForUpdate()
    expect(q(container, 'loaded')).toBeNull()

    emitter().emit('exposure', [[{ 'exposure-id': 'a', 'exposure-scene': 'feed' }]])
    await waitForUpdate()
    expect(q(container, 'loaded')).not.toBeNull()
  })

  it('ignores an exposure event for another element in the same scene', async () => {
    const { container } = render(host())
    await waitForUpdate()

    emitter().emit('exposure', [[{ 'exposure-id': 'b', 'exposure-scene': 'feed' }]])
    await waitForUpdate()
    expect(q(container, 'loaded')).toBeNull()
  })
})

describe('LazyComponent — exports', () => {
  it('exports LazyComponent', async () => {
    const mod = await import('.')
    expect(mod.LazyComponent).toBeDefined()
  })
})
