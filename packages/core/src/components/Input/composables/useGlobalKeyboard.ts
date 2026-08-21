/**
 * useGlobalKeyboard — subscribe to Lynx's `keyboardstatuschanged` global event
 * from a Vue component, with automatic cleanup on unmount.
 *
 * Lynx publishes keyboard show/hide through the background-thread
 * `GlobalEventEmitter`; this is a typed wrapper over `useGlobalEvent`, mirroring
 * the `useGlobalEventListener` hook the upstream ReactLynx port uses. On web /
 * jsdom there is no equivalent platform event, so it degrades to a no-op.
 *
 * Callback signature mirrors the native payload:
 * `(status, keyboardHeight, legacyKeyboardHeight)` — the legacy height is kept
 * for API parity with the React port and can usually be ignored.
 */

import { useGlobalEvent } from '@/shared/composables/useGlobalEvent'

export type KeyboardStatus = 'on' | 'off'

export type KeyboardStatusListener = (
  status: KeyboardStatus,
  keyboardHeight: number,
  legacyKeyboardHeight: number,
) => void

/** Subscribe to `keyboardstatuschanged`; attached in `onMounted`, detached in
 *  `onUnmounted`, so it is safe to call inside any SFC's `setup()`. */
export function useGlobalKeyboard(listener: KeyboardStatusListener): void {
  useGlobalEvent('keyboardstatuschanged', (...args: unknown[]) => {
    const status = args[0] as KeyboardStatus
    const keyboardHeight = (args[1] as number) ?? 0
    const legacyKeyboardHeight = (args[2] as number) ?? 0
    listener(status, keyboardHeight, legacyKeyboardHeight)
  })
}
