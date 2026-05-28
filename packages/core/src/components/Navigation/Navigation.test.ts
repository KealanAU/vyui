// Copyright 2026 The Lynx Authors. All rights reserved.
// Licensed under the Apache License Version 2.0.

import { describe, expect, it } from 'vitest'

import { useNavigationStack } from './useNavigationStack'

describe('Navigation — exports', () => {
  it('exports NavigationStack, NavigationPage, and useNavigationStack', async () => {
    const mod = await import('.')
    expect(mod.NavigationStack).toBeDefined()
    expect(mod.NavigationPage).toBeDefined()
    expect(mod.useNavigationStack).toBeDefined()
    expect(mod.injectNavigationStackContext).toBeDefined()
  })
})

describe('useNavigationStack — initial state', () => {
  it('seeds entries from string-only initial list', () => {
    const stack = useNavigationStack(['home'])
    expect(stack.entries.value).toEqual([{ key: 'home' }])
    expect(stack.current.value).toEqual({ key: 'home' })
    expect(stack.canGoBack.value).toBe(false)
    expect(stack.direction.value).toBe('reset')
  })

  it('preserves data on initial entries', () => {
    const stack = useNavigationStack<{ id: number }>([
      { key: 'home' },
      { key: 'detail', data: { id: 42 } },
    ])
    expect(stack.entries.value).toHaveLength(2)
    expect(stack.current.value?.data).toEqual({ id: 42 })
    expect(stack.canGoBack.value).toBe(true)
  })

  it('starts empty when initial omitted', () => {
    const stack = useNavigationStack()
    expect(stack.entries.value).toEqual([])
    expect(stack.current.value).toBeUndefined()
    expect(stack.canGoBack.value).toBe(false)
  })
})

describe('useNavigationStack — push', () => {
  it('appends an entry and sets direction = "forward"', () => {
    const stack = useNavigationStack(['home'])
    stack.push('detail', { id: 1 })
    expect(stack.entries.value).toEqual([
      { key: 'home' },
      { key: 'detail', data: { id: 1 } },
    ])
    expect(stack.current.value?.key).toBe('detail')
    expect(stack.direction.value).toBe('forward')
    expect(stack.canGoBack.value).toBe(true)
  })

  it('push without data omits the data field', () => {
    const stack = useNavigationStack(['home'])
    stack.push('settings')
    expect(stack.current.value).toEqual({ key: 'settings', data: undefined })
  })
})

describe('useNavigationStack — pop', () => {
  it('removes the top entry and sets direction = "back"', () => {
    const stack = useNavigationStack(['home', 'detail'])
    stack.pop()
    expect(stack.entries.value).toEqual([{ key: 'home' }])
    expect(stack.direction.value).toBe('back')
    expect(stack.canGoBack.value).toBe(false)
  })

  it('pops multiple steps at once', () => {
    const stack = useNavigationStack(['a', 'b', 'c', 'd'])
    stack.pop(2)
    expect(stack.entries.value.map(e => e.key)).toEqual(['a', 'b'])
  })

  it('no-ops at the root', () => {
    const stack = useNavigationStack(['home'])
    const before = stack.entries.value
    stack.pop()
    // entries ref unchanged on no-op (root protection).
    expect(stack.entries.value).toBe(before)
    expect(stack.direction.value).toBe('reset')
  })

  it('clamps to leave at least one entry', () => {
    const stack = useNavigationStack(['a', 'b', 'c'])
    stack.pop(99)
    expect(stack.entries.value).toEqual([{ key: 'a' }])
  })
})

describe('useNavigationStack — replace', () => {
  it('swaps the top entry without growing the stack', () => {
    const stack = useNavigationStack(['home', 'settings'])
    stack.replace('profile', { id: 7 })
    expect(stack.entries.value).toEqual([
      { key: 'home' },
      { key: 'profile', data: { id: 7 } },
    ])
    expect(stack.direction.value).toBe('replace')
  })

  it('seeds a fresh entry when called on an empty stack', () => {
    const stack = useNavigationStack()
    stack.replace('home')
    expect(stack.entries.value).toEqual([{ key: 'home' }])
    expect(stack.direction.value).toBe('replace')
  })
})

describe('useNavigationStack — reset', () => {
  it('rewrites entries and sets direction = "reset"', () => {
    const stack = useNavigationStack(['a', 'b'])
    stack.push('c')
    stack.reset(['x', { key: 'y', data: 1 }])
    expect(stack.entries.value).toEqual([
      { key: 'x' },
      { key: 'y', data: 1 },
    ])
    expect(stack.direction.value).toBe('reset')
  })
})
