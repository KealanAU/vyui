/**
 * Vitest setup file — wires LynxTestingEnv dual-thread pipeline for vyui.
 *
 * Import this via vitest.config.ts `setupFiles`. It runs before any test
 * module loads, so globalThis already has the Lynx PAPI globals (__CreateElement,
 * __AppendElement, etc.) by the time Vue renders components.
 *
 * Pipeline:
 *   Main Thread: renderPage, vuePatchUpdate (PAPI ops executor)
 *   BG Thread:   publishEvent, lynx.getNativeApp().callLepusMethod
 *
 * TODO: This manually wires globalThis hooks that @lynx-js/testing-environment
 * doesn't yet expose as public API. Once the following PR merges, replace this
 * with the official hook-based approach:
 * https://github.com/lynx-family/lynx-stack/pull/2564
 */

import { JSDOM } from 'jsdom'
import { LynxTestingEnv } from '@lynx-js/testing-environment'

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
const lynxTestingEnv = new LynxTestingEnv(jsdom)

;(globalThis as any).lynxTestingEnv = lynxTestingEnv

// --- Main thread ---

lynxTestingEnv.switchToMainThread()

if (typeof (globalThis as any).registerWorkletInternal === 'undefined') {
  ;(globalThis as any).registerWorkletInternal = () => {}
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

// --- Background thread ---

lynxTestingEnv.switchToBackgroundThread()

await import('vue-lynx/entry-background')

const publishEventFn = (globalThis as any).publishEvent
const bgGlobal = lynxTestingEnv.backgroundThread.globalThis as any
bgGlobal.publishEvent = publishEventFn

// --- Post-reset re-wiring ---

;(globalThis as any).onSwitchedToMainThread = () => {
  Object.assign(globalThis, mainThreadFns)
}

;(globalThis as any).onSwitchedToBackgroundThread = () => {
  if ((globalThis as any).lynxCoreInject?.tt) {
    ;(globalThis as any).lynxCoreInject.tt.publishEvent = publishEventFn
  }
  ;(globalThis as any).publishEvent = publishEventFn
}

// Stay on background thread — tests start here by default.
