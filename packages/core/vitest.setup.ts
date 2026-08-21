import { beforeAll, expect, vi } from 'vitest'

import { configureAxe } from 'vitest-axe'
import * as matchers from 'vitest-axe/matchers'
import '@testing-library/jest-dom/vitest'

// vitest-canvas-mock needs the jsdom-environment globals; script tests
// (`@vitest-environment node`, e.g. vite-worklet-plugin.test.js) don't have
// them — testing-utils' setup installs a `window`, but not the constructor
// the mock patches, so gate on that constructor rather than `window`.
if (typeof HTMLCanvasElement !== 'undefined') {
  await import('vitest-canvas-mock')
}

expect.extend(matchers)

configureAxe({
  globalOptions: {
    rules: [{
      id: 'region',
      enabled: false,
    }],
  },
})

// @lynx-js/testing-environment throws for data-* in __SetAttribute.
// The switchToMainThread() hook fires AFTER copying mainThread.globalThis to
// global, letting us overwrite __SetAttribute with a version that routes
// data-* through element.setAttribute() instead of throwing.
const _env = (globalThis as any).lynxTestingEnv
const _origSetAttribute = _env?.mainThread?.globalThis?.__SetAttribute as
  ((e: any, key: string, value: any) => void) | undefined

function _patchedSetAttribute(e: any, key: string, value: any) {
  if (/^data-/.test(key)) {
    if (value === null || value === undefined) {
      e.removeAttribute?.(key)
    }
    else {
      e.setAttribute?.(key, typeof value === 'string' ? value : JSON.stringify(value))
    }
    return
  }
  return _origSetAttribute?.(e, key, value)
}

// Also patch mainThread.globalThis so switchToMainThread copies our version.
if (_env?.mainThread?.globalThis) {
  _env.mainThread.globalThis.__SetAttribute = _patchedSetAttribute
}

// Extend the onSwitchedToMainThread hook — fires every time the testing
// environment switches to main thread, after it copies mainThread.globalThis
// to global. We overwrite __SetAttribute so ops-apply.js uses our version.
const _prevOnSwitchedToMainThread = (globalThis as any).onSwitchedToMainThread
;(globalThis as any).onSwitchedToMainThread = () => {
  _prevOnSwitchedToMainThread?.()
  ;(globalThis as any).__SetAttribute = _patchedSetAttribute
}

beforeAll(() => {
  if (typeof window === 'undefined') return // node-env script tests

  window.HTMLElement.prototype.scrollIntoView = vi.fn()

  const originalGetComputedStyle = window.getComputedStyle
  window.getComputedStyle = (elt: Element, _pseudoElt?: string | null) =>
    originalGetComputedStyle(elt)
})
