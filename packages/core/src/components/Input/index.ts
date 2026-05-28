// Adapted from lynx-family/lynx-ui (Apache-2.0) — packages/lynx-ui-input/src/index.tsx
export {
  default as Input,
  type InputConfirmType,
  type InputEmits,
  type InputExposed,
  type InputProps,
  type InputType,
} from './Input.vue'

export {
  default as Textarea,
  type TextareaEmits,
  type TextareaExposed,
  type TextareaProps,
} from './Textarea.vue'

export {
  default as KeyboardAwareRoot,
  type KeyboardAwareRootProps,
} from './KeyboardAwareRoot.vue'

export {
  default as KeyboardAwareTrigger,
  type KeyboardAwareTriggerProps,
} from './KeyboardAwareTrigger.vue'

export {
  default as KeyboardAwareResponder,
  type KeyboardAwareResponderMode,
  type KeyboardAwareResponderProps,
} from './KeyboardAwareResponder.vue'

export {
  injectKeyboardAwareRootContext,
  injectKeyboardAwareTriggerContext,
  type KeyboardAwareNodeRef,
  type KeyboardAwareRootContext,
  type KeyboardAwareTriggerContext,
  type KeyboardAwareTriggerRef,
  provideKeyboardAwareRootContext,
  provideKeyboardAwareTriggerContext,
} from './keyboardAwareContext'

export {
  type KeyboardStatus,
  type KeyboardStatusListener,
  useGlobalKeyboard,
} from './composables/useGlobalKeyboard'
