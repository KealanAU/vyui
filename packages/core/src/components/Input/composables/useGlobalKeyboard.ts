/**
 * useGlobalKeyboard — subscribe to Lynx's `keyboardstatuschanged` global event
 * from a Vue component, with automatic cleanup on unmount.
 *
 * Lynx publishes keyboard show/hide events through the background-thread
 * `GlobalEventEmitter`. The upstream ReactLynx port (`lynx-family/lynx-ui`)
 * wraps the subscription in `@lynx-js/react-use`'s `useGlobalEventListener`
 * hook — that helper isn't available to vue-lynx consumers, so we re-create
 * the subscription here with the same lifecycle semantics.
 *
 * On web / jsdom the `lynx` global is absent and there is no equivalent
 * platform event, so the composable degrades to a no-op. This keeps the
 * KeyboardAware* family safe to mount in vitest without mocks.
 *
 * Callback signature mirrors the native event payload:
 *   `(status: 'on' | 'off', keyboardHeight: number, legacyKeyboardHeight: number) => void`
 *
 * The legacy height arg is preserved for API parity with the React port — most
 * callers can ignore it.
 */

import { onMounted, onUnmounted } from 'vue'

export type KeyboardStatus = 'on' | 'off'

export type KeyboardStatusListener = (
  status: KeyboardStatus,
  keyboardHeight: number,
  legacyKeyboardHeight: number,
) => void

/**
 * Subscribe to `keyboardstatuschanged`. The listener is attached in
 * `onMounted` and detached in `onUnmounted`, so it is safe to call inside
 * `setup()` of any SFC.
 *
 * Why `getJSModule('GlobalEventEmitter')`?
 *   On Lynx the background thread does not expose `lynx.addEventListener` for
 *   platform notifications; the documented entry point is
 *   `lynx.getJSModule('GlobalEventEmitter').addListener(...)`. Listeners
 *   receive variadic args, so we cast to the typed signature at the call site.
 */
export function useGlobalKeyboard(listener: KeyboardStatusListener): void {
  const lynxGlobal: any = (globalThis as any).lynx
  if (!lynxGlobal || typeof lynxGlobal.getJSModule !== 'function')
    return

  const wrapped = (...args: unknown[]) => {
    const status = args[0] as KeyboardStatus
    const keyboardHeight = (args[1] as number) ?? 0
    const legacyKeyboardHeight = (args[2] as number) ?? 0
    listener(status, keyboardHeight, legacyKeyboardHeight)
  }

  let emitter: any
  onMounted(() => {
    try {
      emitter = lynxGlobal.getJSModule('GlobalEventEmitter')
      emitter?.addListener?.('keyboardstatuschanged', wrapped)
    }
    catch {
      // Swallow — keyboard awareness is best-effort.
    }
  })

  onUnmounted(() => {
    try {
      emitter?.removeListener?.('keyboardstatuschanged', wrapped)
    }
    catch {
      // Swallow.
    }
  })
}
