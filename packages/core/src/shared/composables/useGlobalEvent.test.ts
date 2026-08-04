import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { render } from '@vyui/testing-utils'
import { useGlobalEvent } from './useGlobalEvent'

// The testing env installs its own `lynx` global with a real GlobalEventEmitter
// and leaves it on `globalThis` for the whole run, so a stub assigned here would
// never be seen. Drive the env's own emitter instead.
function emitter(): { listeners: Record<string, unknown[]>, emit: (name: string, args?: unknown[]) => void } {
  return (globalThis as any).lynx.getJSModule('GlobalEventEmitter')
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
  ;(emitter() as any).clear()
})

describe('useGlobalEvent', () => {
  // Deleting the global around `render()` does nothing: render() switches
  // threads internally and the env reinstalls `lynx` before setup runs. It has
  // to be deleted inside setup, where the composable actually reads it.
  it('does not throw and registers nothing when the lynx global is absent', () => {
    render(host(() => {
      const lynx = (globalThis as any).lynx
      delete (globalThis as any).lynx
      try {
        useGlobalEvent('ping', vi.fn())
      }
      finally {
        ;(globalThis as any).lynx = lynx
      }
    }))
    expect(emitter().listeners.ping).toBeUndefined()
  })

  it('subscribes on mount and unsubscribes on unmount', () => {
    const listener = vi.fn()
    const { unmount } = render(host(() => useGlobalEvent('ping', listener)))

    emitter().emit('ping', ['payload'])
    expect(listener).toHaveBeenCalledWith('payload')

    unmount()
    emitter().emit('ping', ['after'])
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('immediate subscribes during setup, before mount', () => {
    let subscribedInSetup = false
    render(host(() => {
      useGlobalEvent('exposure', vi.fn(), { immediate: true })
      subscribedInSetup = emitter().listeners.exposure?.length === 1
    }))
    expect(subscribedInSetup).toBe(true)
  })

  it('without immediate, nothing is subscribed during setup', () => {
    let subscribedInSetup = true
    render(host(() => {
      useGlobalEvent('exposure', vi.fn())
      subscribedInSetup = (emitter().listeners.exposure?.length ?? 0) > 0
    }))
    expect(subscribedInSetup).toBe(false)
  })
})
