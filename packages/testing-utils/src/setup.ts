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
 * Built on the public @lynx-js/testing-environment setup hooks documented in
 * lynx-family/lynx-stack#2564: we install the env, capture vue-lynx's runtime
 * fns by importing its chunks on the matching thread, then re-apply them through
 * `onInjectMainThreadGlobals` / `onInjectBackgroundThreadGlobals`. Because those
 * hooks fire on every inject (incl. `reset()`) and write onto the per-thread
 * global, the fns survive each `switchTo*Thread()` — no manual re-wiring needed.
 */

import { JSDOM } from 'jsdom'
import { installLynxTestingEnv } from '@lynx-js/testing-environment'

const jsdom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
installLynxTestingEnv(globalThis as any, { window: jsdom.window as any })
const lynxTestingEnv = (globalThis as any).lynxTestingEnv

// --- Capture main-thread runtime fns ---

lynxTestingEnv.switchToMainThread()

// vue-lynx/main-thread references registerWorkletInternal at import time; stub it
// if the worklet-runtime chunk hasn't provided one yet.
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
  registerWorkletInternal: (globalThis as any).registerWorkletInternal,
}

// --- Capture background-thread runtime fns ---

lynxTestingEnv.switchToBackgroundThread()

await import('vue-lynx/entry-background')

const publishEventFn = (globalThis as any).publishEvent

// --- Wire via the documented testing-environment hooks (#2564) ---

const prevInjectMain = (globalThis as any).onInjectMainThreadGlobals
;(globalThis as any).onInjectMainThreadGlobals = (target: any) => {
  prevInjectMain?.(target)
  Object.assign(target, mainThreadFns)
}

const prevInjectBg = (globalThis as any).onInjectBackgroundThreadGlobals
;(globalThis as any).onInjectBackgroundThreadGlobals = (target: any) => {
  prevInjectBg?.(target)
  // vue-lynx routes native events via lynxCoreInject.tt.publishEvent (modern) and
  // globalThis.publishEvent (older fallback) — wire both onto the thread global.
  target.publishEvent = publishEventFn
  if (target.lynxCoreInject?.tt) {
    target.lynxCoreInject.tt.publishEvent = publishEventFn
  }
}

const prevInitWorklet = (globalThis as any).onInitWorkletRuntime
;(globalThis as any).onInitWorkletRuntime = () => {
  prevInitWorklet?.()
  if (typeof (globalThis as any).registerWorkletInternal === 'undefined') {
    ;(globalThis as any).registerWorkletInternal = () => {}
  }
  return true
}

// Apply the inject hooks once to the already-constructed thread globals; from here
// on, env.reset() re-fires them automatically.
;(globalThis as any).onInjectMainThreadGlobals(lynxTestingEnv.mainThread.globalThis)
;(globalThis as any).onInjectBackgroundThreadGlobals(lynxTestingEnv.backgroundThread.globalThis)

// Stay on background thread — tests start here by default.
lynxTestingEnv.switchToBackgroundThread()
