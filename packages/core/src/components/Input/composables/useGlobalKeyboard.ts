/**
 * useGlobalKeyboard — subscribe to Lynx's `keyboardstatuschanged` global event
 * from a Vue component, with automatic cleanup on unmount.
 *
 * Lynx publishes keyboard show/hide events through the background-thread
 * `GlobalEventEmitter`; this is a typed wrapper over `useGlobalEvent`,
 * mirroring the `@lynx-js/react-use` `useGlobalEventListener` hook the
 * upstream ReactLynx port (`lynx-family/lynx-ui`) uses.
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

import { useGlobalEvent } from '@/shared/composables/useGlobalEvent'

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
 */
export function useGlobalKeyboard(listener: KeyboardStatusListener): void {
  useGlobalEvent('keyboardstatuschanged', (...args: unknown[]) => {
    const status = args[0] as KeyboardStatus
    const keyboardHeight = (args[1] as number) ?? 0
    const legacyKeyboardHeight = (args[2] as number) ?? 0
    listener(status, keyboardHeight, legacyKeyboardHeight)
  })
}
