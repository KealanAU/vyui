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
