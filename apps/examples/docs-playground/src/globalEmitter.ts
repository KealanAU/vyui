import type { GlobalEventEmitter } from '@lynx-js/types'

// Host → card channel (`lynx-view.sendGlobalEvent`). `lynx.getJSModule` is a
// no-op on web-core's background lynx, so fall back to the emitter the web
// runtime actually emits on — the native app's own.
export function globalEmitter(): GlobalEventEmitter | undefined {
  if (typeof lynx === 'undefined') return undefined
  const nativeApp = (lynx as { getNativeApp?: () => { GlobalEventEmitter?: GlobalEventEmitter } }).getNativeApp?.()
  return lynx.getJSModule('GlobalEventEmitter') ?? nativeApp?.GlobalEventEmitter
}
