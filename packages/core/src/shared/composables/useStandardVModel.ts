import type { Ref } from 'vue'
import { useVModel } from '@vueuse/core'

/**
 * Loose emit signature accepted by the helpers. Component-generated
 * `defineEmits` types vary (intersection of overloads keyed on literal event
 * names, payload-required, etc.) — accepting `(...args: any[]) => void`
 * lets the helper take any of them without requiring per-call-site casts.
 */
type AnyEmit = (...args: any[]) => void

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
  return useVModel(props as any, 'modelValue', emits as any, {
    defaultValue: (props.defaultValue ?? defaultValue) as any,
    passive: (props.modelValue === undefined) as false,
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
  return useVModel(props as any, propName as any, emits as any, {
    defaultValue: (props[defaultPropName] ?? defaultValue) as any,
    passive: (props[propName] === undefined) as false,
  }) as Ref<T>
}
