<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/TextArea.tsx.

  Multi-line text input that wraps Lynx's `<textarea>` element. Shares the
  imperative API + event mapping documented on `Input.vue`; the extra props
  here are the multi-line ones: `lineSpacing`, `bounces`, `maxLines`.

  Naming note: lynx-ui exports `TextArea` (PascalCase, two words). We export
  `Textarea` (matching the JSX intrinsic) so it composes cleanly with
  Reka-style conventions across the rest of vyui. Both spellings are
  preserved on the public types.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import type { InputConfirmType, InputType } from './Input.vue'

export interface TextareaProps extends PrimitiveProps {
  id?: string
  /** Controlled value — pair with `@update:modelValue` (or `v-model`). */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  placeholder?: string
  /** Whether the textarea renders as read-only. */
  readonly?: boolean
  /** When `true`, prevents the user from interacting with the textarea. */
  disabled?: boolean
  /**
   * Maximum number of characters allowed. Unset by default, leaving the
   * platform's own limit in place: iOS and Android are unlimited, while
   * Harmony applies the documented Lynx default of 140. Pass an explicit
   * value to enforce a limit, or to get identical behavior on every platform.
   */
  maxLength?: number
  /** Maximum number of visible lines before scrolling kicks in. Defaults to
   *  `40` to match the React port. */
  maxLines?: number
  /** Spacing between lines in px / lynx-units. Forwarded to the native node. */
  lineSpacing?: number | string
  /** Whether the textarea scroll-view should bounce at its edges (iOS). */
  bounces?: boolean
  /** Input mode hint — see `InputType`. */
  type?: InputType
  /** Regex string filter applied by the native input before the value is
   *  surfaced to JS. */
  inputFilter?: string
  /** On-screen return-key label — see `InputConfirmType`. */
  confirmType?: InputConfirmType
  /** When `false`, focus will not raise the software keyboard. */
  showSoftInputOnFocus?: boolean
  /**
   * Native keyboard avoidance (Lynx `avoid-keyboard`) — see `Input.vue`'s
   * prop of the same name: shifts the whole LynxView by the overlap, exact
   * native math; do NOT combine with a `KeyboardAwareRoot`.
   */
  avoidKeyboard?: boolean
  /**
   * Extra clearance in px above the keyboard when `avoidKeyboard` shifts
   * the view. Normalized to a px string on the wire — Android's native
   * setter only parses string values.
   */
  avoidKeyboardSpacing?: number
}

export interface TextareaExposed {
  focus: () => Promise<void>
  blur: () => Promise<void>
  clear: () => Promise<void>
  setValue: (value: string) => Promise<void>
  getValue: () => Promise<{ value: string, selectionStart: number, selectionEnd: number }>
  setSelectionRange: (selectionStart: number, selectionEnd: number) => Promise<void>
}

export type TextareaEmits = {
  'update:modelValue': [value: string]
  'input': [value: string, selectionStart: number, selectionEnd: number, isComposing: boolean]
  'focus': [value: string]
  'blur': [value: string]
  'confirm': [value: string]
  'selectionChange': [selectionStart: number, selectionEnd: number]
  /**
   * Software-keyboard show/hide while focused. Normalized from Lynx's raw
   * `{ show, keyBoardHeight, safeAreaBottom }` element event — see `Input.vue`
   * for why this element event (not the global emitter) is the keyboard signal
   * under vue-lynx.
   */
  'keyboard': [info: { visible: boolean, height: number, safeAreaBottom: number }]
}
</script>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/components/Primitive'
import type { KeyboardAwareNodeRef } from './keyboardAwareContext'
import {
  injectKeyboardAwareRootContext,
  injectKeyboardAwareTriggerContext,
} from './keyboardAwareContext'

/** See `Input.vue` — kept local to avoid a util dependency. */
class InvokeRejectError extends Error {
  errorCode: number
  detail?: string
  constructor(errorCode: number, errorMsg?: string) {
    super(typeof errorMsg === 'string' ? errorMsg : 'unknown error')
    this.errorCode = errorCode
    this.detail = errorMsg
  }
}

const props = withDefaults(defineProps<TextareaProps>(), {
  as: 'textarea',
  readonly: false,
  disabled: false,
  type: 'text',
  maxLines: 40,
  bounces: true,
  confirmType: 'send',
  showSoftInputOnFocus: true,
})
const emit = defineEmits<TextareaEmits>()

const { primitiveElement, currentElement } = usePrimitiveElement()
const triggerContext = injectKeyboardAwareTriggerContext(null)

// See `Input.vue` — trigger-less self-registration with a surrounding
// `KeyboardAwareRoot`; a wrapping trigger takes precedence. `selfRef` identity
// must stay stable (the root's blur path compares by reference).
const rootContext = triggerContext ? null : injectKeyboardAwareRootContext(null)
const selfRef: KeyboardAwareNodeRef = { current: null }

const controlled = ref(props.modelValue !== undefined)

/** See `Input.vue` for the rationale on the resolve/invoke pair. */
function resolveDomEl(el: any): any {
  if (!el)
    return null
  if (typeof el.tagName === 'string')
    return el
  return null
}

function invokeMethod<T = void>(method: string, params?: Record<string, any>): Promise<T> {
  return new Promise((resolve, reject) => {
    const el: any = currentElement.value
    if (!el?.invoke) {
      reject(new InvokeRejectError(2, 'no node found for the ref'))
      return
    }
    try {
      el.invoke({
        method,
        params,
        success: (res: T) => resolve(res),
        fail: (res: { code: number, data: string }) =>
          reject(new InvokeRejectError(res.code, res.data)),
      }).exec()
    }
    catch (e: any) {
      reject(new InvokeRejectError(0, e?.message ?? String(e)))
    }
  })
}

async function focus(): Promise<void> {
  try { await invokeMethod<void>('focus') }
  catch { resolveDomEl(currentElement.value)?.focus?.() }
}

async function blur(): Promise<void> {
  try { await invokeMethod<void>('blur') }
  catch { resolveDomEl(currentElement.value)?.blur?.() }
}

async function setValue(value: string): Promise<void> {
  try { await invokeMethod<void>('setValue', { value }) }
  catch {
    const dom = resolveDomEl(currentElement.value)
    if (dom && 'value' in dom)
      dom.value = value
  }
}

async function getValue(): Promise<{ value: string, selectionStart: number, selectionEnd: number }> {
  try {
    return await invokeMethod<{ value: string, selectionStart: number, selectionEnd: number }>('getValue')
  }
  catch {
    const dom = resolveDomEl(currentElement.value)
    return {
      value: dom?.value ?? '',
      selectionStart: dom?.selectionStart ?? 0,
      selectionEnd: dom?.selectionEnd ?? 0,
    }
  }
}

async function setSelectionRange(selectionStart: number, selectionEnd: number): Promise<void> {
  try { await invokeMethod<void>('setSelectionRange', { selectionStart, selectionEnd }) }
  catch { resolveDomEl(currentElement.value)?.setSelectionRange?.(selectionStart, selectionEnd) }
}

async function clear(): Promise<void> {
  await setValue('')
  if (controlled.value)
    emit('update:modelValue', '')
}

// `renderValue` is what `:value` binds to in the template. We decouple it
// from `props.modelValue` so that when the user types, the prop updates via
// v-model without re-pushing the whole (growing) string back through
// vue-lynx's `patchProp → SET_PROP` op. Programmatic updates still flow
// through because they don't match `lastNativeValue`.
const renderValue = ref(props.modelValue ?? '')
let lastNativeValue: string | undefined
watch(() => props.modelValue, (next) => {
  if (!controlled.value)
    return
  const v = next ?? ''
  if (v === lastNativeValue)
    return
  renderValue.value = v
})

onMounted(() => {
  if (!controlled.value && props.defaultValue !== undefined)
    setValue(props.defaultValue)
})

function readInputEventDetail(event: any) {
  const detail = event?.detail ?? {}
  const value: string = detail.value ?? event?.target?.value ?? ''
  const selectionStart: number = detail.selectionStart ?? event?.target?.selectionStart ?? 0
  const selectionEnd: number = detail.selectionEnd ?? event?.target?.selectionEnd ?? 0
  const isComposing: boolean = detail.isComposing ?? false
  return { value, selectionStart, selectionEnd, isComposing }
}

function handleInput(event: any) {
  const { value, selectionStart, selectionEnd, isComposing } = readInputEventDetail(event)
  lastNativeValue = value
  if (controlled.value)
    emit('update:modelValue', value)
  emit('input', value, selectionStart, selectionEnd, isComposing)
}

// A surrounding Trigger owns the registration when present — see Input.vue's
// handleFocus for why self-registering as well would clobber it.
function handleFocus(event: any) {
  if (triggerContext) {
    triggerContext.onInputFocused()
  }
  else if (rootContext) {
    selfRef.current = currentElement.value
    rootContext.onAwareTriggerFocused?.(selfRef)
  }
  const value: string = event?.detail?.value ?? event?.target?.value ?? props.modelValue ?? ''
  emit('focus', value)
}

function handleBlur(event: any) {
  if (triggerContext)
    triggerContext.onInputBlurred()
  else
    rootContext?.onAwareTriggerBlurred?.(selfRef)
  const value: string = event?.detail?.value ?? event?.target?.value ?? props.modelValue ?? ''
  emit('blur', value)
}

function handleConfirm(event: any) {
  const value: string = event?.detail?.value ?? event?.target?.value ?? props.modelValue ?? ''
  emit('confirm', value)
}

function handleSelection(event: any) {
  const detail = event?.detail ?? {}
  emit('selectionChange', detail.selectionStart ?? 0, detail.selectionEnd ?? 0)
}

// Normalize Lynx's raw `{ show, keyBoardHeight, safeAreaBottom }` keyboard
// payload — see `Input.vue`'s `keyboard` emit for the rationale. Also piped
// up the KeyboardAware chain (the only keyboard signal that reaches
// `KeyboardAwareRoot` on device).
function handleKeyboard(event: any) {
  const d = event?.detail ?? {}
  const info = {
    visible: d.show === 1 || d.show === true,
    height: Number(d.keyBoardHeight ?? d.keyboardHeight ?? d.height ?? 0) || 0,
    safeAreaBottom: Number(d.safeAreaBottom ?? 0) || 0,
  }
  if (triggerContext)
    triggerContext.onInputKeyboard(info)
  else
    rootContext?.onAwareTriggerKeyboardChanged?.(selfRef, info)
  emit('keyboard', info)
}

defineExpose<TextareaExposed>({
  focus,
  blur,
  clear,
  setValue,
  getValue,
  setSelectionRange,
})
</script>

<template>
  <Primitive
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    :id="id"
    :value="renderValue"
    :placeholder="placeholder"
    :readonly="readonly || undefined"
    :disabled="disabled || undefined"
    :maxlength="maxLength"
    :maxlines="maxLines"
    :line-spacing="lineSpacing"
    :bounces="bounces"
    :type="type"
    :input-filter="inputFilter"
    :confirm-type="confirmType"
    :show-soft-input-on-focus="showSoftInputOnFocus"
    :avoid-keyboard="avoidKeyboard || undefined"
    :avoid-keyboard-spacing="avoidKeyboardSpacing != null ? `${avoidKeyboardSpacing}px` : undefined"
    ignore-focus
    accessibility-traits="keyboard"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @confirm="handleConfirm"
    @selection="handleSelection"
    @keyboard="handleKeyboard"
  >
    <slot />
  </Primitive>
</template>
