import type { Ref, UnwrapRef, WritableComputedRef } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'

export interface UseVModelOptions<T, Passive extends boolean = false> {
  /**
   * Mirror the prop into a local ref with `watch` instead of reading straight
   * through it. Needed when the parent may not write the emitted value back
   * (uncontrolled usage).
   * @default false
   */
  passive?: Passive
  /** Watch nested mutations of the local ref. Only applies with `passive`. */
  deep?: boolean
  /** Value used while the prop is `undefined`. */
  defaultValue?: T
}

/**
 * Adapted from @vueuse/core (MIT) — https://github.com/vueuse/vueuse
 *
 * `v-model` bridge: a writable ref over `props[key]` that emits `update:<key>`
 * on write. Trimmed to what core uses — no `clone`, `eventName`, `shouldEmit`,
 * or implicit `getCurrentInstance` emit.
 */
export function useVModel<P extends object, K extends keyof P, Name extends string>(props: P, key: K, emit?: (name: Name, ...args: any[]) => void, options?: UseVModelOptions<P[K], false>): WritableComputedRef<P[K]>
export function useVModel<P extends object, K extends keyof P, Name extends string>(props: P, key: K, emit?: (name: Name, ...args: any[]) => void, options?: UseVModelOptions<P[K], true>): Ref<UnwrapRef<P[K]>>
export function useVModel<P extends object, K extends keyof P>(
  props: P,
  key: K,
  emit?: (name: any, ...args: any[]) => void,
  options: UseVModelOptions<P[K], boolean> = {},
): any {
  const { passive = false, deep = false, defaultValue } = options
  const event = `update:${String(key)}`
  const getValue = () => (props[key] !== undefined ? props[key] : defaultValue)

  if (!passive) {
    return computed({
      get: getValue,
      set: value => emit?.(event, value),
    })
  }

  const proxy = ref<any>(getValue())
  // Guards the prop → ref → emit → prop round trip from re-emitting.
  let isUpdating = false

  watch(
    () => props[key],
    (v) => {
      if (isUpdating)
        return
      isUpdating = true
      proxy.value = v
      nextTick(() => { isUpdating = false })
    },
  )

  watch(
    proxy,
    (v) => {
      // `deep` values mutate in place, so the identity check can't see them.
      if (!isUpdating && (v !== props[key] || deep))
        emit?.(event, v)
    },
    { deep },
  )

  return proxy
}
