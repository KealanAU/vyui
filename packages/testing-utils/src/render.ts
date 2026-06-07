/**
 * render() — mounts a Vue component through the full Lynx dual-thread pipeline.
 *
 * Returns a JSDOM container element with @testing-library/dom queries.
 * Use this instead of @vue/test-utils mount() when you need real Lynx
 * element nodes (LynxElement extends HTMLElement) or proper Lynx event routing.
 *
 * Pipeline:
 *   1. Main thread renderPage() → creates PAPI page root (id=1)
 *   2. BG thread resetForTesting() → createApp(component).mount()
 *   3. Vue scheduler flushes → callLepusMethod('vuePatchUpdate', ops)
 *      → LynxTestingEnv switches to MT → applyOps → JSDOM
 *   4. Return container + @testing-library/dom queries
 */

import type { Component } from 'vue'
import { getQueriesForElement } from '@testing-library/dom'
import { createApp, nextTick } from 'vue-lynx'
import type { VueLynxApp } from 'vue-lynx'

// resetForTesting is exported at runtime but absent from published type defs
const vueLynxRuntime = await import('vue-lynx') as any
const resetForTesting: () => void = vueLynxRuntime.resetForTesting

let currentApp: VueLynxApp | null = null

export interface RenderResult {
  container: Element
  unmount: () => void
  rerender: (component: Component, props?: Record<string, unknown>) => RenderResult
  [key: string]: any
}

export function cleanup(): void {
  if (currentApp) {
    const env = (globalThis as any).lynxTestingEnv
    env.switchToBackgroundThread()
    currentApp.unmount()
    currentApp = null
  }
}

export function render(
  rootComponent: Component,
  rootProps?: Record<string, unknown>,
): RenderResult {
  const env = (globalThis as any).lynxTestingEnv
  if (!env) {
    throw new Error(
      '[vyui/testing-utils] LynxTestingEnv not found. '
      + 'Make sure @vyui/testing-utils/setup is in vitest setupFiles.',
    )
  }

  cleanup()

  env.switchToMainThread()
  const doc = env.env.window.document
  doc.body.innerHTML = ''

  const renderPage = (globalThis as any).renderPage
  if (typeof renderPage === 'function') {
    renderPage({})
  }

  env.switchToBackgroundThread()
  resetForTesting()

  const app = createApp(rootComponent, rootProps)
  currentApp = app
  app.mount()

  env.switchToMainThread()
  const container = doc.body.firstElementChild ?? doc.body

  env.switchToBackgroundThread()

  return {
    container,
    unmount: () => cleanup(),
    rerender: (component: Component, props?: Record<string, unknown>) =>
      render(component, props),
    ...getQueriesForElement(container),
  }
}

export async function waitForUpdate(): Promise<void> {
  const env = (globalThis as any).lynxTestingEnv
  env?.switchToBackgroundThread()
  await nextTick()
  await nextTick()
}
