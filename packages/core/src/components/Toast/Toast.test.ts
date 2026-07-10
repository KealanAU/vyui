import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import Toast from './story/_Toast.vue'
import ToastClosed from './story/_ToastClosed.vue'
import ToastDuration from './story/_ToastDuration.vue'

function q(container: Element, id: string) {
  return container.querySelector(`[data-testid="${id}"]`) as HTMLElement | null
}

describe('Toast — initial state', () => {
  it('renders open by default', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    expect(q(container, 'toast')).not.toBeNull()
    expect(q(container, 'toast')?.getAttribute('data-state')).toBe('open')
  })

  it('has data-type="foreground" by default', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    expect(q(container, 'toast')?.getAttribute('data-type')).toBe('foreground')
  })

  it('registers itself with the provider (count=1)', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    expect(q(container, 'count')?.textContent).toBe('1')
  })

  it('a single toast is the front of the stack', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    expect(q(container, 'is-front')?.textContent).toBe('true')
    expect(q(container, 'toast')?.hasAttribute('data-front')).toBe(true)
  })
})

describe('Toast — close behaviour', () => {
  it('ToastClose tap unmounts the toast and emits update:open=false', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    fireEvent.tap(q(container, 'close')!)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
    expect(q(container, 'last-open-event')?.textContent).toBe('false')
  })

  it('ToastClose as-child over Button closes the toast (modifier handler survives the emit)', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    fireEvent.tap(q(container, 'close-as-child-button')!)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
    expect(q(container, 'last-open-event')?.textContent).toBe('false')
  })

  it('ToastAction closes AND emits action', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    fireEvent.tap(q(container, 'action')!)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
    expect(q(container, 'action-count')?.textContent).toBe('1')
  })
})

describe('Toast — auto-dismiss timer (fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('auto-dismisses after `duration` ms', async () => {
    const { container } = render(ToastDuration, { duration: 1000 })
    await waitForUpdate()
    expect(q(container, 'toast')).not.toBeNull()
    vi.advanceTimersByTime(1000)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
  })

  it('does not auto-dismiss when duration=0', async () => {
    const { container } = render(ToastDuration, { duration: 0 })
    await waitForUpdate()
    vi.advanceTimersByTime(10_000)
    await waitForUpdate()
    expect(q(container, 'toast')).not.toBeNull()
  })

  it('falls back to the provider duration', async () => {
    const { container } = render(Toast, { providerDuration: 1500 })
    await waitForUpdate()
    vi.advanceTimersByTime(1500)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
  })

})

describe('Toast — progress countdown (fake timers)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes the resolved duration as a slot value', async () => {
    const { container } = render(Toast, { providerDuration: 2000 })
    await waitForUpdate()
    expect(q(container, 'local-duration')?.textContent).toBe('2000')
  })

  it('drains progress from 1 toward 0 over the duration', async () => {
    const { container } = render(Toast, { providerDuration: 1000 })
    await waitForUpdate()
    expect(q(container, 'progress')?.textContent).toBe('1')

    vi.advanceTimersByTime(500)
    await waitForUpdate()
    const mid = Number(q(container, 'progress')?.textContent)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('keeps progress at 1 when auto-dismiss is off (duration=0)', async () => {
    const { container } = render(Toast, { providerDuration: 0 })
    await waitForUpdate()
    vi.advanceTimersByTime(5000)
    await waitForUpdate()
    expect(q(container, 'progress')?.textContent).toBe('1')
  })

  it('freezes progress while the stack is expanded', async () => {
    const { container } = render(Toast, { providerDuration: 1000 })
    await waitForUpdate()
    vi.advanceTimersByTime(300)
    await waitForUpdate()
    fireEvent.tap(q(container, 'expand-btn')!)
    await waitForUpdate()
    const frozen = Number(q(container, 'progress')?.textContent)
    vi.advanceTimersByTime(2000)
    await waitForUpdate()
    // Still mounted (timer paused) and progress unchanged.
    expect(q(container, 'toast')).not.toBeNull()
    expect(Number(q(container, 'progress')?.textContent)).toBe(frozen)
  })
})

describe('Toast — stack expansion', () => {
  it('expand sets data-expanded on the toast', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    fireEvent.tap(q(container, 'expand-btn')!)
    await waitForUpdate()
    expect(q(container, 'expanded')?.textContent).toBe('true')
    expect(q(container, 'toast')?.hasAttribute('data-expanded')).toBe(true)
  })

  it('toggleExpanded flips the flag', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    fireEvent.tap(q(container, 'toggle-btn')!)
    await waitForUpdate()
    expect(q(container, 'expanded')?.textContent).toBe('true')
    fireEvent.tap(q(container, 'toggle-btn')!)
    await waitForUpdate()
    expect(q(container, 'expanded')?.textContent).toBe('false')
  })

  it('expandByDefault starts the provider expanded', async () => {
    const { container } = render(Toast, { expandByDefault: true })
    await waitForUpdate()
    expect(q(container, 'expanded')?.textContent).toBe('true')
  })
})

describe('Toast — slot props', () => {
  it('local index / count / isFront / heightBefore have sane defaults for a single toast', async () => {
    const { container } = render(Toast)
    await waitForUpdate()
    expect(q(container, 'local-index')?.textContent).toBe('0')
    expect(q(container, 'local-count')?.textContent).toBe('1')
    expect(q(container, 'is-front')?.textContent).toBe('true')
    expect(q(container, 'height-before')?.textContent).toBe('0')
  })
})

describe('Toast — defaultOpen=false', () => {
  it('does not paint the toast (v-if=open hides Primitive)', async () => {
    const { container } = render(ToastClosed)
    await waitForUpdate()
    expect(q(container, 'toast')).toBeNull()
  })
})
