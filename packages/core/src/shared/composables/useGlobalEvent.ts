/**
 * useGlobalEvent — subscribe to a Lynx `GlobalEventEmitter` event from a Vue
 * component, with automatic cleanup on unmount.
 *
 * `GlobalEventEmitter` is the background-thread channel for native → JS events:
 * Lynx's own and anything the host sends via `sendGlobalEvent`. The documented
 * entry point is `lynx.getJSModule('GlobalEventEmitter').addListener(...)` —
 * there is no `lynx.addEventListener` on the background thread. On web / jsdom
 * the `lynx` global is absent and this degrades to a no-op.
 */

import type { GlobalEventEmitter } from '@lynx-js/types'
import { onMounted, onUnmounted } from 'vue'

export interface UseGlobalEventOptions {
  /**
   * Subscribe synchronously during `setup()` instead of in `onMounted`, for
   * events that can fire before mount. Cleanup still runs in `onUnmounted`.
   * @defaultValue false
   */
  immediate?: boolean
}

/**
 * Subscribe to a named `GlobalEventEmitter` event. Listeners receive the event's
 * variadic args verbatim — cast at the call site. Call during `setup()`.
 */
export function useGlobalEvent(
  name: string,
  listener: (...args: unknown[]) => void,
  options?: UseGlobalEventOptions,
): void {
  const lynxGlobal = globalThis.lynx
  if (!lynxGlobal || typeof lynxGlobal.getJSModule !== 'function')
    return

  let emitter: GlobalEventEmitter | undefined
  const subscribe = (): void => {
    try {
      emitter = lynxGlobal.getJSModule<GlobalEventEmitter>('GlobalEventEmitter')
      emitter?.addListener?.(name, listener)
    }
    catch {
      // Swallow — global events are best-effort.
    }
  }

  if (options?.immediate) subscribe()
  else onMounted(subscribe)

  onUnmounted(() => {
    try {
      emitter?.removeListener?.(name, listener)
    }
    catch {
      // Swallow.
    }
  })
}
