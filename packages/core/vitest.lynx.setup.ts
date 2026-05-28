/**
 * Vitest setup for vue-lynx testing pipeline.
 *
 * Wires LynxTestingEnv so tests use the real vue-lynx dual-thread renderer:
 * BG thread (Vue reactivity + nodeOps) → ops → MT (PAPI) → JSDOM
 *
 * Import render/fireEvent from '@lynx-js/vue-test-utils' (re-exported from
 * this package's test helpers) instead of @vue/test-utils.
 */

import { JSDOM } from 'jsdom'
import { LynxTestingEnv } from '@lynx-js/testing-environment'

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
const lynxTestingEnv = new LynxTestingEnv(jsdom);

(globalThis as any).lynxTestingEnv = lynxTestingEnv

// --- Main thread setup ------------------------------------------------------

lynxTestingEnv.switchToMainThread()

if (typeof (globalThis as any).registerWorkletInternal === 'undefined') {
  (globalThis as any).registerWorkletInternal = () => {}
}

await import('vue-lynx/main-thread')

const mainThreadFns = {
  renderPage: (globalThis as any).renderPage,
  vuePatchUpdate: (globalThis as any).vuePatchUpdate,
  processData: (globalThis as any).processData,
  updatePage: (globalThis as any).updatePage,
  updateGlobalProps: (globalThis as any).updateGlobalProps,
}

const mtGlobal = lynxTestingEnv.mainThread.globalThis as any
Object.assign(mtGlobal, mainThreadFns)

// --- Background thread setup ------------------------------------------------

lynxTestingEnv.switchToBackgroundThread()

await import('vue-lynx/entry-background')

const publishEventFn = (globalThis as any).publishEvent
const bgGlobal = lynxTestingEnv.backgroundThread.globalThis as any
bgGlobal.publishEvent = publishEventFn

// --- Re-wire after reset (called by cleanup() between tests) ----------------

;(globalThis as any).onSwitchedToMainThread = () => {
  Object.assign(globalThis, mainThreadFns)
}

;(globalThis as any).onSwitchedToBackgroundThread = () => {
  if ((globalThis as any).lynxCoreInject?.tt) {
    (globalThis as any).lynxCoreInject.tt.publishEvent = publishEventFn
  }
  ;(globalThis as any).publishEvent = publishEventFn
}

// Leave in main-thread mode so @vue/test-utils tests have jsdom available.
// Tests using render() from @/test-utils switch threads explicitly.
lynxTestingEnv.switchToMainThread()
