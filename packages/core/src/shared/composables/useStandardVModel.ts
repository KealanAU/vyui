import type { Ref } from 'vue'
import { getCurrentInstance, shallowRef, watch } from 'vue'
import { useVModel } from '@vueuse/core'

/**
 * Loose emit signature accepted by the helpers — component-generated
 * `defineEmits` types vary, and `(...args: any[]) => void` takes any of them
 * without per-call-site casts.
 */
type AnyEmit = (...args: any[]) => void

const toKebab = (s: string) => s.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)

/**
 * Whether the parent supplied a given binding, read from the raw vnode props.
 * Vnode prop keys are kebab-cased under the vue-lynx renderer, so both spellings
 * are checked. This cannot use `props[name] === undefined`: vue-lynx normalizes
 * unset boolean props to `false`, which would lock every boolean into
 * controlled mode.
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
 * `@vyui/core`. Bridges `props.modelValue` + emit to a writable local Ref,
 * selecting `passive: false` when the parent is controlling and `passive: true`
 * when uncontrolled. Returns `Ref<T>`, so pass a sensible `defaultValue`.
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
 * Variant for `v-model:<name>` (open, snapIndex, …). Same semantics with a
 * different prop+event name; the "default" prop is looked up by the
 * conventional `default${Capitalised}` name. For a non-conventional default-prop
 * name, use the base `useVModel` directly.
 */
export function useStandardVModelOf<T>(
  props: Record<string, any>,
  propName: string,
  emits: AnyEmit,
  defaultValue?: T,
): Ref<T> {
  const defaultPropName = `default${propName.charAt(0).toUpperCase()}${propName.slice(1)}`
  const defaultVal = (props[defaultPropName] ?? defaultValue) as T

  // "Controlled" = the parent supplied the binding, detected from the raw vnode
  // props: vue-lynx normalizes unset booleans to `false`, so a
  // `props[propName] === undefined` check would pin the component to controlled
  // and make `default*` dead.
  const controlled = isControlled(propName)

  if (!controlled) {
    // Uncontrolled: own the state in a local ref, seeded from `default*`.
    // vueuse's `passive` path seeds from `props[propName]`, which is `false` for
    // an unset boolean, so `default*` would never surface.
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
