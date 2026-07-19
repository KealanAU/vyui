<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/Input.tsx.

  Single-line text input that wraps Lynx's `<input>` element. The React port
  uses imperative `inputRef.invoke({ method: 'setValue' })` calls to keep the
  native state in sync; in Vue we expose v-model AND the same imperative
  methods (`focus`, `blur`, `clear`, `setValue`, `getValue`,
  `setSelectionRange`) via `defineExpose`, so consumers can drive the input
  either declaratively or imperatively.

  Native event mapping
  --------------------
    Lynx ReactLynx prop  →  vue-lynx attribute on `<input>`
    -------------------- → --------------------------------
    `main-thread:bindinput` → `@input` (background-thread `onInput`)
    `bindfocus`             → `@focus`
    `bindblur`              → `@blur`
    `bindconfirm`           → `@confirm`
    `bindselection`         → `@selection`
    `bindkeyboard`          → `@keyboard`
  The main-thread `bindinput` variant from the React port is dropped here —
  vue-lynx doesn't surface `main-thread:` event bindings in templates, so we
  use the equivalent background-thread `@input` (same `event.detail` payload).
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * `type` mirrors Lynx's input modes. `password`, `digit`, `tel`, `email` map
 * onto the corresponding software-keyboard modes on native; on web the value
 * is forwarded to the underlying `<input type="...">`.
 */
export type InputType = 'text' | 'number' | 'digit' | 'tel' | 'email' | 'password'

/**
 * `confirmType` controls the on-screen return-key label. The Lynx defaults
 * are: `done`, `next`, `search`, `send`, `go`. Defaulting to `'send'` keeps
 * parity with the React port.
 */
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
}

/**
 * Imperative handle exposed via `defineExpose`. Mirrors the methods exposed
 * by the React port's `InputRef`, including the async return shape — these
 * are real cross-thread invokes on Lynx, synchronous fallbacks on web.
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
   * Lynx delivers this as an element event on the native `<input>` with the
   * raw shape `{ show: 0|1, keyBoardHeight, safeAreaBottom }` (note the capital
   * B in `keyBoardHeight`); it is normalized here to `{ visible, height,
   * safeAreaBottom }`.
   *
   * This is the reliable way to react to the keyboard under vue-lynx: the
   * global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted by the
   * native side but is NOT delivered to the vue-lynx background runtime, so
   * this per-element event is what consumers (and keyboard-aware lifts) should
   * use. Verified on the iOS simulator; Android payload fields may differ.
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
 * Minimal local error type used to reject the `invoke()` promise without
 * pulling a util dependency. Carries the upstream `{ code, data }` shape so
 * consumers that already pattern-match on `errorCode` keep working.
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

/**
 * Tracks whether this is a controlled input. We honor v-model when
 * `modelValue` was supplied at mount, regardless of later prop churn (this
 * matches the React port's `useRef(value !== undefined)`).
 */
const controlled = ref(props.modelValue !== undefined)

/**
 * Resolve the underlying DOM `<input>` element behind the Lynx
 * `ShadowElement` returned by `currentElement`. In native Lynx there is no
 * paired DOM node and this returns `null` — callers fall back to a no-op.
 * In jsdom / vue-lynx tests the ShadowElement is paired with a real
 * `HTMLInputElement` tagged with `[vue-ref-{id}]`, which is what we look up
 * here so the imperative API still works under test.
 */
function resolveDomEl(el: any): any {
  if (!el)
    return null
  if (typeof el.tagName === 'string')
    return el
  return null
}

/**
 * Invoke a Lynx UI method via the cross-thread selector query.
 *
 * On native Lynx this is the only way to drive focus / value / selection
 * changes from background-thread JS. In the test environment the
 * ShadowElement carries an `invoke()` method that throws "not implemented"
 * — we catch that synchronous throw and let the calling method take its DOM
 * fallback path.
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
    // mirror). Fall back to the last value the component observed — that is
    // the controlled `renderValue` for v-model users and the latest input
    // event payload for uncontrolled ones.
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
  // The reactive `:value` binding repaints the field on the web DOM, but a
  // native Lynx `<input>` treats `value` as initial-only — once rendered, it
  // ignores prop updates. So programmatic changes (e.g. a stepper button
  // driving NumberField) must be pushed imperatively too. The `lastNativeValue`
  // guard above means we never reach here for the user's own keystrokes, so
  // this can't fight the caret while typing.
  setValue(v)
})

// Apply `defaultValue` once for uncontrolled inputs.
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
  // Controlled: forward via v-model — the new value flows back through the
  // `watch` above. Uncontrolled: let the native input own the value, just
  // emit the change event so consumers can observe.
  if (controlled.value)
    emit('update:modelValue', value)
  emit('input', value, selectionStart, selectionEnd, isComposing)
}

// A surrounding Trigger owns the registration when present: it reports its
// WRAPPER element (the visual field) and its own offset. Self-registering as
// well would clobber both — the root keeps only the last report — so the lift
// would measure the bare input and drop the trigger's offset.
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
// payload. See the `keyboard` entry in `InputEmits` for why this element event
// (not the global emitter) is the keyboard signal under vue-lynx. The payload
// is also piped up the KeyboardAware chain — it is the only keyboard signal
// that reaches `KeyboardAwareRoot` on device.
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
