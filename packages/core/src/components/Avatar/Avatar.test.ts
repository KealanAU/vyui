import { createEvent } from '@testing-library/dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import _Avatar from './story/_Avatar.vue'

function image(container: Element) {
  return container.querySelector('[data-testid="image"]') as Element | null
}
function fallback(container: Element) {
  return container.querySelector('[data-testid="fallback"]') as Element | null
}

/**
 * Dispatch the native Lynx `binderror` event (bound in Vue as `@error`).
 * Lynx routes events as `bindEvent:<name>`, so a bare `error` Event won't reach
 * the handler (and would trip jsdom's special-cased window error path). Mirror
 * the keyed `fireEvent.*` path used for `tap` / `input` with `eventName: error`.
 */
function fireImageError(el: Element) {
  const eventInit = { eventType: 'bindEvent', eventName: 'error' }
  const event = createEvent('bindEvent:error', el, eventInit)
  Object.assign(event, eventInit)
  fireEvent(el, event)
}

describe('Avatar — image / fallback', () => {
  it('renders the image and hides the fallback when src loads', () => {
    const { container } = render(_Avatar, { src: 'https://example.com/a.png', fallback: 'AB' })
    expect(image(container)).not.toBeNull()
    expect(fallback(container)).toBeNull()
  })

  it('shows the fallback when there is no src', () => {
    const { container } = render(_Avatar, { fallback: 'AB' })
    expect(image(container)).toBeNull()
    expect(fallback(container)).not.toBeNull()
  })

  it('shows the fallback when the image errors', async () => {
    const { container } = render(_Avatar, { src: 'https://example.com/bad.png', fallback: 'AB' })
    const img = image(container)
    expect(img).not.toBeNull()
    fireImageError(img!)
    await waitForUpdate()
    expect(image(container)).toBeNull()
    expect(fallback(container)).not.toBeNull()
  })
})

describe('Avatar — delayMs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the fallback immediately when delayMs is 0', () => {
    const { container } = render(_Avatar, { fallback: 'AB', delayMs: 0 })
    expect(fallback(container)).not.toBeNull()
  })

  it('delays rendering the fallback when delayMs > 0', async () => {
    const { container } = render(_Avatar, { fallback: 'AB', delayMs: 50 })
    // Not yet visible right after mount.
    expect(fallback(container)).toBeNull()
    vi.advanceTimersByTime(50)
    await waitForUpdate()
    expect(fallback(container)).not.toBeNull()
  })
})
