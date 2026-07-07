// Adapted from lynx-family/lynx-ui (Apache-2.0) —
// packages/lynx-ui-input/src/KeyboardAwareContext.tsx.
//
// React port exposed two context objects via `createContext`. Vue uses
// provide/inject — vyui's `createContext` helper returns the symmetric
// `[inject, provide]` tuple used across the codebase.
import type { Ref } from 'vue'
import { createContext } from '@/shared'

/**
 * Loose `NodeRef`-shaped wrapper used by KeyboardAware* trigger refs. Mirrors
 * the structural ref used by `setNativePropsByRef` so call sites that already
 * produce such an object stay compatible.
 */
export interface KeyboardAwareNodeRef {
  current: unknown
}

/**
 * Normalized software-keyboard payload as emitted by `Input` / `Textarea`'s
 * `keyboard` event (Lynx's raw per-element `{ show, keyBoardHeight,
 * safeAreaBottom }` shape, normalized).
 */
export interface KeyboardAwareKeyboardInfo {
  visible: boolean
  height: number
  safeAreaBottom: number
}

/**
 * Context published by `KeyboardAwareRoot` and consumed by
 * `KeyboardAwareTrigger` / `KeyboardAwareResponder`. Triggers report focus,
 * blur, layout, and keyboard changes; the responder reports its scroll-view
 * metadata so the root can adjust the on-screen offset when the keyboard
 * appears.
 */
export interface KeyboardAwareRootContext {
  onAwareTriggerFocused: (triggerRef: KeyboardAwareNodeRef, offset?: number) => void
  onAwareTriggerBlurred: (triggerRef: KeyboardAwareNodeRef) => void
  onAwareTriggerLayoutChanged: (triggerRef: KeyboardAwareNodeRef) => void
  /**
   * Keyboard show/hide reported from the focused input's per-element
   * `@keyboard` event. This is the root's primary keyboard signal on Lynx —
   * the global `keyboardstatuschanged` event never reaches the vue-lynx
   * background runtime (see `Input.vue`), so without this the root would
   * never learn the keyboard height.
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
 * `Textarea`. Inputs forward their native focus / blur events up to the
 * surrounding trigger so the trigger can in turn notify the root.
 *
 * Inputs may render outside any trigger (the most common case), so consumers
 * inject this context with a `null` fallback and call the optional callbacks
 * defensively. The ref-typed `triggerRef` field is omitted from this context
 * because the trigger owns it internally.
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
