/**
 * Test utilities for vyui component tests.
 *
 * Uses the vue-lynx dual-thread pipeline (real renderer, real event registry).
 * Requires vitest.lynx.setup.ts to have run first (wires LynxTestingEnv).
 *
 * Usage:
 *   import { render, fireEvent, screen } from '@/test-utils'
 */

import type { Component } from 'vue-lynx'
// @ts-expect-error — resetForTesting exists in runtime but is missing from vue-lynx 0.3.1 type declarations
import { createApp, resetForTesting, nextTick } from 'vue-lynx'
import { createEvent, fireEvent as domFireEvent, getQueriesForElement, screen, within } from '@testing-library/dom'

export { screen, within }

export interface RenderResult {
  container: Element
  unmount: () => void
  [key: string]: any
}

let currentApp: ReturnType<typeof createApp> | null = null

export function cleanup(): void {
  const env = (globalThis as any).lynxTestingEnv
  if (!env) return
  if (currentApp) {
    env.switchToBackgroundThread()
    currentApp.unmount()
    currentApp = null
  }
}

export function render(
  component: Component,
  props?: Record<string, unknown>,
): RenderResult {
  const env = (globalThis as any).lynxTestingEnv
  if (!env) throw new Error('LynxTestingEnv not initialised — did vitest.lynx.setup.ts run?')

  cleanup()

  env.switchToMainThread()
  const doc = env.jsdom.window.document
  doc.body.innerHTML = ''
  const renderPage = (globalThis as any).renderPage
  if (typeof renderPage === 'function') renderPage({})

  env.switchToBackgroundThread()
  resetForTesting()

  const app = createApp(component as any, props)
  currentApp = app
  app.mount()

  env.switchToMainThread()
  const container = (doc.body.firstElementChild ?? doc.body) as HTMLElement
  env.switchToBackgroundThread()

  return {
    container,
    unmount: cleanup,
    ...getQueriesForElement(container),
  }
}

export async function waitForUpdate(): Promise<void> {
  const env = (globalThis as any).lynxTestingEnv
  env?.switchToBackgroundThread()
  await nextTick()
  await nextTick()
}

// ---------------------------------------------------------------------------
// fireEvent — routes through the Lynx event pipeline via bindEvent:<name>
// ---------------------------------------------------------------------------

const LYNX_EVENTS = [
  'tap', 'longtap', 'longpress',
  'touchstart', 'touchmove', 'touchend', 'touchcancel',
  'scroll', 'scrollend', 'input', 'confirm', 'focus', 'blur',
] as const

type LynxEventName = typeof LYNX_EVENTS[number]

type FireEvent = {
  [K in LynxEventName]: (el: Element, init?: EventInit) => boolean
}

export const fireEvent = LYNX_EVENTS.reduce((acc, name) => {
  acc[name] = (el: Element, init?: EventInit) => {
    const env = (globalThis as any).lynxTestingEnv
    env?.switchToBackgroundThread()
    const event = createEvent(
      `bindEvent:${name}`,
      el,
      { bubbles: true, cancelable: true, ...init },
      { EventType: 'Event' },
    )
    return domFireEvent(el, event)
  }
  return acc
}, {} as FireEvent)

// Auto-cleanup after each test
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    cleanup()
    ;(globalThis as any).lynxTestingEnv?.reset()
  })
}
