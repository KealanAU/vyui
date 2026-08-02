import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from '@vyui/testing-utils'
import { useGlobalEvent } from './useGlobalEvent'

function stubLynx() {
  const emitter = { addListener: vi.fn(), removeListener: vi.fn() }
  ;(globalThis as any).lynx = { getJSModule: (name: string) => (name === 'GlobalEventEmitter' ? emitter : undefined) }
  return emitter
}

function host(setup: () => void) {
  return defineComponent({
    setup() {
      setup()
      return () => h('view')
    },
  })
}

afterEach(() => {
  delete (globalThis as any).lynx
})

describe('useGlobalEvent', () => {
  it('no-ops without a lynx global', () => {
    const listener = vi.fn()
    expect(() => render(host(() => useGlobalEvent('ping', listener)))).not.toThrow()
  })

  it('subscribes on mount and unsubscribes on unmount', () => {
    const emitter = stubLynx()
    const listener = vi.fn()
    const { unmount } = render(host(() => useGlobalEvent('ping', listener)))
    expect(emitter.addListener).toHaveBeenCalledWith('ping', listener)
    unmount()
    expect(emitter.removeListener).toHaveBeenCalledWith('ping', listener)
  })

  it('immediate subscribes during setup, before mount', () => {
    const emitter = stubLynx()
    const listener = vi.fn()
    let subscribedInSetup = false
    render(host(() => {
      useGlobalEvent('exposure', listener, { immediate: true })
      subscribedInSetup = emitter.addListener.mock.calls.length === 1
    }))
    expect(subscribedInSetup).toBe(true)
  })
})
