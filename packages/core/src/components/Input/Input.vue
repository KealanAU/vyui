<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/Input.tsx.

  Single-line text input wrapping Lynx's `<input>`. Exposes v-model AND the
  React port's imperative methods (`focus`, `blur`, `clear`, `setValue`,
  `getValue`, `setSelectionRange`) via `defineExpose`.

  The port's main-thread `bindinput` is dropped: vue-lynx doesn't surface
  `main-thread:` event bindings in templates, so `@input` (same `event.detail`
  payload) stands in.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * `type` mirrors Lynx's input modes: software-keyboard modes on native,
 * forwarded to `<input type="...">` on web.
 */
export type InputType = 'text' | 'number' | 'digit' | 'tel' | 'email' | 'password'

/** `confirmType` controls the on-screen return-key label: `done`, `next`,
 *  `search`, `send`, `go`. Defaults to `'send'`, matching the React port. */
export type InputConfirmType = 'done' | 'next' | 'search' | 'send' | 'go'

export interface InputProps extends PrimitiveProps {
  id?: string
  /** Controlled value — pair with `@update:modelValue` (or `v-model`). */
  modelValue?: string
  /** Initial value when uncontrolled. */
  defaultValue?: string
  placeholder?: string
  /** Whether the input renders as read-only. */
  readonly?: boolean
  /** When `true`, prevents the user from interacting with the input. */
  disabled?: boolean
  /** Maximum number of characters allowed. Defaults to `140` per the Lynx
   *  default — set explicitly to `0` for no limit on platforms that support it. */
  maxLength?: number
  /** Input mode hint — see `InputType`. */
  type?: InputType
  /** Regex string filter applied by the native input before the value is
   *  surfaced to JS. Passed through unchanged. */
  inputFilter?: string
  /** On-screen return-key label — see `InputConfirmType`. */
  confirmType?: InputConfirmType
  /** Browser/native capitalization hint forwarded to the underlying input. */
  autocapitalize?: string
  /** Browser/native correction hint forwarded to the underlying input. */
  autocorrect?: string
  /** When `false`, focus will not raise the software keyboard. */
  showSoftInputOnFocus?: boolean
  /**
   * Native keyboard avoidance (Lynx `avoid-keyboard`): the platform shifts the
   * WHOLE LynxView up by the keyboard overlap and restores it on dismiss. Do
   * NOT combine with a `KeyboardAwareRoot` — the two lifts stack.
   */
  avoidKeyboard?: boolean
  /**
   * Extra clearance in px kept above the keyboard when `avoidKeyboard` shifts
   * the view. Normalized to a px string — Android's setter only parses strings.
   */
  avoidKeyboardSpacing?: number
}

/**
 * Imperative handle exposed via `defineExpose`. Mirrors the React port's
 * `InputRef`, including the async return shape.
 */
export interface InputExposed {
  focus: () => Promise<void>
  blur: () => Promise<void>
  /** Clears the value and emits `update:modelValue` with `""`. */
  clear: () => Promise<void>
  setValue: (value: string) => Promise<void>
  getValue: () => Promise<{ value: string, selectionStart: number, selectionEnd: number }>
  setSelectionRange: (selectionStart: number, selectionEnd: number) => Promise<void>
}

export type InputEmits = {
  /** v-model emit. */
  'update:modelValue': [value: string]
  /** Fires on every input change. Args mirror the React port:
   *  `(value, selectionStart, selectionEnd, isComposing)`. */
  'input': [value: string, selectionStart: number, selectionEnd: number, isComposing: boolean]
  /** Fires when the native input gains focus. */
  'focus': [value: string]
  /** Fires when the native input loses focus. */
  'blur': [value: string]
  /** Fires when the user submits via the return key. */
  'confirm': [value: string]
  /** Fires when the user moves the selection caret / changes the selection. */
  'selectionChange': [selectionStart: number, selectionEnd: number]
  /**
   * Fires when the software keyboard shows/hides while this input is focused.
   * Lynx delivers the raw shape `{ show: 0|1, keyBoardHeight, safeAreaBottom }`
   * (capital B); normalized here to `{ visible, height, safeAreaBottom }`.
   *
   * This per-element event is the reliable keyboard signal under vue-lynx: the
   * global `keyboardstatuschanged` event is emitted natively but never
   * delivered to the vue-lynx background runtime.
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

/**
 * Minimal local error type carrying the upstream `{ code, data }` shape so
 * consumers pattern-matching on `errorCode` keep working.
 */
class InvokeRejectError extends Error {
  errorCode: number
  detail?: string
  constructor(errorCode: number, errorMsg?: string) {
    super(typeof errorMsg === 'string' ? errorMsg : 'unknown error')
    this.errorCode = errorCode
    this.detail = errorMsg
  }
}

const props = withDefaults(defineProps<InputProps>(), {
  as: 'input',
  readonly: false,
  disabled: false,
  type: 'text',
  maxLength: 140,
  confirmType: 'send',
  showSoftInputOnFocus: true,
})
const emit = defineEmits<InputEmits>()

const { primitiveElement, currentElement } = usePrimitiveElement()

/** Triggers may not exist — call optionally. */
const triggerContext = injectKeyboardAwareTriggerContext(null)

// Trigger-less keyboard awareness: when a `KeyboardAwareRoot` is above but no
// `KeyboardAwareTrigger` wraps this input, register the input itself as the
// trigger so apps don't need per-input wrappers. A wrapping trigger takes
// precedence (it may group several inputs or carry an `offset`).
const rootContext = triggerContext ? null : injectKeyboardAwareRootContext(null)

// Identity must stay stable across focus/blur — the root's delayed blur path
// compares `focusedRef.value === triggerRef` before clearing.
const selfRef: KeyboardAwareNodeRef = { current: null }

/** Controlled when `modelValue` was supplied at mount, regardless of later prop
 *  churn (matches the React port's `useRef(value !== undefined)`). */
const controlled = ref(props.modelValue !== undefined)

/**
 * Resolve the underlying DOM `<input>` behind the Lynx `ShadowElement`. Native
 * Lynx has no paired DOM node and returns `null`; under jsdom the ShadowElement
 * is paired with a real `HTMLInputElement` tagged `[vue-ref-{id}]`.
 */
function resolveDomEl(el: any): any {
  if (!el)
    return null
  if (typeof el.tagName === 'string')
    return el
  return null
}

/**
 * Invoke a Lynx UI method via the cross-thread selector query — on native the
 * only way to drive focus / value / selection from background JS. In tests the
 * ShadowElement's `invoke()` throws "not implemented"; the synchronous throw is
 * caught so callers take their DOM fallback path.
 */
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
  try {
    await invokeMethod<void>('focus')
  }
  catch {
    resolveDomEl(currentElement.value)?.focus?.()
  }
}

async function blur(): Promise<void> {
  try {
    await invokeMethod<void>('blur')
  }
  catch {
    resolveDomEl(currentElement.value)?.blur?.()
  }
}

async function setValue(value: string): Promise<void> {
  try {
    await invokeMethod<void>('setValue', { value })
  }
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
    if (dom && 'value' in dom) {
      return {
        value: dom.value ?? '',
        selectionStart: dom.selectionStart ?? 0,
        selectionEnd: dom.selectionEnd ?? 0,
      }
    }
    // No DOM access (vue-lynx tests expose a virtual element with no `.value`
    // mirror). Fall back to the last value the component observed.
    return {
      value: lastNativeValue ?? renderValue.value,
      selectionStart: 0,
      selectionEnd: 0,
    }
  }
}

async function setSelectionRange(selectionStart: number, selectionEnd: number): Promise<void> {
  try {
    await invokeMethod<void>('setSelectionRange', { selectionStart, selectionEnd })
  }
  catch {
    resolveDomEl(currentElement.value)?.setSelectionRange?.(selectionStart, selectionEnd)
  }
}

async function clear(): Promise<void> {
  await setValue('')
  if (controlled.value)
    emit('update:modelValue', '')
}

// `renderValue` is what `:value` binds to. Decoupled from `props.modelValue` so
// typing doesn't re-push the whole growing string back through vue-lynx's
// `patchProp → SET_PROP` op. Programmatic updates still flow through because
// they don't match `lastNativeValue`.
const renderValue = ref(props.modelValue ?? '')
let lastNativeValue: string | undefined
watch(() => props.modelValue, (next) => {
  if (!controlled.value)
    return
  const v = next ?? ''
  if (v === lastNativeValue)
    return
  renderValue.value = v
  // A native Lynx `<input>` treats `value` as initial-only, so programmatic
  // changes must be pushed imperatively too. The `lastNativeValue` guard above
  // means this never runs for the user's own keystrokes.
  setValue(v)
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
  // Controlled: forward via v-model, which flows back through the `watch`
  // above. Uncontrolled: let the native input own the value.
  if (controlled.value)
    emit('update:modelValue', value)
  emit('input', value, selectionStart, selectionEnd, isComposing)
}

// A surrounding Trigger owns the registration when present: it reports its
// WRAPPER element and its own offset. Self-registering as well would clobber
// both — the root keeps only the last report.
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

// Normalize Lynx's raw `{ show, keyBoardHeight, safeAreaBottom }` payload. Also
// piped up the KeyboardAware chain — it is the only keyboard signal that
// reaches `KeyboardAwareRoot` on device.
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

defineExpose<InputExposed>({
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
    :type="type"
    :input-filter="inputFilter"
    :confirm-type="confirmType"
    :autocapitalize="autocapitalize"
    :autocorrect="autocorrect"
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
