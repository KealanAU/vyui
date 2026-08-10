import type { Ref } from 'vue'
import { getCurrentInstance, shallowRef, watch } from 'vue'
import { useVModel } from '@vueuse/core'

/**
 * Loose emit signature accepted by the helpers. Component-generated
 * `defineEmits` types vary (intersection of overloads keyed on literal event
 * names, payload-required, etc.) — accepting `(...args: any[]) => void`
 * lets the helper take any of them without requiring per-call-site casts.
 */
type AnyEmit = (...args: any[]) => void

const toKebab = (s: string) => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)

/**
 * Whether the parent supplied a given binding, read from the raw vnode props.
 * Vnode prop keys are kebab-cased under the vue-lynx renderer (e.g.
 * `model-value`, `snap-index`), so check both the camelCase name and its
 * kebab form. This cannot use `props[name] === undefined`: vue-lynx normalizes
 * unset boolean props to `false`, which would make every boolean read
 * "defined" and lock the component into controlled mode.
 */
function isControlled(propName: string): boolean {
  const inst = getCurrentInstance()
  const vnodeProps = inst?.vnode?.props as Record<string, unknown> | undefined
  if (!vnodeProps)
    return false
  return propName in vnodeProps || toKebab(propName) in vnodeProps
}

/**
 * Standard `v-model` setup used by every controlled-state component in
 * `@vyui/core`. Bridges Vue's parent-controlled `props.modelValue` + emit
 * pattern to a writable local Ref, automatically selecting `passive: false`
 * when the parent is controlling and `passive: true` when uncontrolled.
 *
 * Returns `Ref<T>` (not `Ref<T | null>`) — pass a sensible `defaultValue`
 * even when `modelValue` is undefined to keep downstream code unsmoothed.
 *
 * @example
 *   const open = useStandardVModel<boolean>(props, emits, props.defaultOpen ?? false)
 *   open.value = true  // emits `update:modelValue`
 */
export function useStandardVModel<T>(
  props: { modelValue?: T | null | undefined, defaultValue?: T | undefined },
  emits: AnyEmit,
  defaultValue?: T,
): Ref<T> {
  const defaultVal = (props.defaultValue ?? defaultValue) as T

  // Controlled detection via raw vnode props, not `modelValue === undefined`
  // (see isControlled — unset booleans normalize to `false`).
  const controlled = isControlled('modelValue')

  if (!controlled) {
    const state = shallowRef<T>(defaultVal)
    watch(
      () => props.modelValue,
      (v) => {
        if (v !== undefined) state.value = v as T
      },
    )
    watch(state, (v) => emits('update:modelValue', v as boolean))
    return state
  }

  return useVModel(props as any, 'modelValue', emits as any, {
    defaultValue: defaultVal as any,
    passive: false,
  }) as Ref<T>
}

/**
 * Variant for `v-model:<name>` (open, snapIndex, etc. — not the default
 * modelValue). Same semantics, different prop+event name.
 *
 * The corresponding "default" prop is looked up using the conventional
 * `default${Capitalised}` name (e.g. `open` -> `defaultOpen`, `snapIndex` ->
 * `defaultSnapIndex`). If the call site uses a non-conventional default-prop
 * name, fall back to the base `useVModel` directly.
 */
export function useStandardVModelOf<T>(
  props: Record<string, any>,
  propName: string,
  emits: AnyEmit,
  defaultValue?: T,
): Ref<T> {
  const defaultPropName = `default${propName.charAt(0).toUpperCase()}${propName.slice(1)}`
  const defaultVal = (props[defaultPropName] ?? defaultValue) as T

  // "Controlled" = the parent supplied the binding, detected from the raw
  // vnode props (not `props[propName]`). vue-lynx normalizes unset boolean
  // props to `false` rather than leaving them `undefined`, so a
  // `props[propName] === undefined` check is never true for them and the
  // component would be treated as permanently controlled — which pins the
  // state and makes `default*` dead (SheetRoot `defaultOpen`, etc.).
  const controlled = isControlled(propName)

  if (!controlled) {
    // Uncontrolled: own the state in a local ref, seeded from `default*`.
    // vueuse's `passive` path reads `props[propName]` for its seed, which is
    // `false` for an unset boolean — so `default*` would never surface. Write
    // the ref directly and mirror any late parent supply of the prop.
    const state = shallowRef<T>(defaultVal)
    watch(
      () => props[propName],
      (v) => {
        if (v !== undefined) state.value = v as T
      },
    )
    watch(state, (v) => emits(`update:${propName}`, v as boolean))
    return state
  }

  return useVModel(props as any, propName as any, emits as any, {
    defaultValue: defaultVal as any,
    passive: false,
  }) as Ref<T>
}
