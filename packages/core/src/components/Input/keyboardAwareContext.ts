// Adapted from lynx-family/lynx-ui (Apache-2.0) —
// packages/lynx-ui-input/src/KeyboardAwareContext.tsx.
import type { Ref } from 'vue'
import { createContext } from '@/shared'

/** Loose `NodeRef`-shaped wrapper used by KeyboardAware* trigger refs, mirroring
 *  the structural ref `setNativePropsByRef` takes. */
export interface KeyboardAwareNodeRef {
  current: unknown
}

/** Normalized software-keyboard payload emitted by `Input` / `Textarea`'s
 *  `keyboard` event. */
export interface KeyboardAwareKeyboardInfo {
  visible: boolean
  height: number
  safeAreaBottom: number
}

/**
 * Context published by `KeyboardAwareRoot` and consumed by
 * `KeyboardAwareTrigger` / `KeyboardAwareResponder`: triggers report focus,
 * blur, layout and keyboard changes, the responder its scroll-view metadata.
 */
export interface KeyboardAwareRootContext {
  onAwareTriggerFocused: (triggerRef: KeyboardAwareNodeRef, offset?: number) => void
  onAwareTriggerBlurred: (triggerRef: KeyboardAwareNodeRef) => void
  onAwareTriggerLayoutChanged: (triggerRef: KeyboardAwareNodeRef) => void
  /**
   * Keyboard show/hide from the focused input's per-element `@keyboard` event —
   * the root's primary keyboard signal on Lynx, since the global
   * `keyboardstatuschanged` never reaches the vue-lynx background runtime.
   */
  onAwareTriggerKeyboardChanged: (triggerRef: KeyboardAwareNodeRef, info: KeyboardAwareKeyboardInfo) => void
  /** Ref to the responder's outer `<view>`. Triggers don't read it but the
   *  root mutates its native `transform` to slide content above the keyboard. */
  keyboardAwareResponder: KeyboardAwareNodeRef
  /** Reports scrollview metadata once the responder has mounted. */
  keyboardAwareResponderScrollInfoCollected: (
    scrollviewId?: string,
    scrollContentId?: string,
    dummyRefAtKeyboardHeight?: KeyboardAwareNodeRef,
  ) => void
}

export const [injectKeyboardAwareRootContext, provideKeyboardAwareRootContext]
  = createContext<KeyboardAwareRootContext>('KeyboardAwareRoot')

/**
 * Context published by `KeyboardAwareTrigger` and consumed by `Input` /
 * `Textarea`, which forward their native focus / blur events up so the trigger
 * can notify the root. Inputs may render outside any trigger, so consumers
 * inject with a `null` fallback and call the callbacks defensively.
 */
export interface KeyboardAwareTriggerContext {
  onInputFocused: () => void
  onInputBlurred: () => void
  /** Forwards the input's normalized `@keyboard` payload up to the root. */
  onInputKeyboard: (info: KeyboardAwareKeyboardInfo) => void
}

export const [injectKeyboardAwareTriggerContext, provideKeyboardAwareTriggerContext]
  = createContext<KeyboardAwareTriggerContext>('KeyboardAwareTrigger')

/** Re-exported for ergonomic typing in stories / tests. */
export type KeyboardAwareTriggerRef = Ref<KeyboardAwareNodeRef | null>
