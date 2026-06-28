import type { MaybeRefOrGetter } from 'vue'
import { camelize, computed, getCurrentInstance, toRef } from 'vue'

interface PropOptions {
  type?: any
  required?: boolean
  default?: any
}

/**
 * Vue coerces optional boolean props (e.g. `foo?: boolean`) to non-optional (`foo: boolean`)
 * in the `defineProps` return type. Since `useForwardProps` only returns props that were
 * explicitly assigned, boolean-typed props should remain optional in the return type.
 */
type WithOptionalBooleans<T> = {
  [K in keyof T as [T[K]] extends [boolean] ? K : never]?: T[K]
} & {
  [K in keyof T as [T[K]] extends [boolean] ? never : K]: T[K]
}

/**
 * Returns a computed value combining default props, preserved props, and the
 * assigned props from the current instance.
 * @param props - the props passed to the component.
 * @returns a computed of the merged props.
 */
export function useForwardProps<T extends Record<string, any>>(props: MaybeRefOrGetter<T>) {
  const vm = getCurrentInstance()
  const defaultProps = Object.keys(vm?.type.props ?? {}).reduce((prev, curr) => {
    const defaultValue = (vm?.type.props[curr] as PropOptions).default
    if (defaultValue !== undefined)
      prev[curr as keyof T] = defaultValue
    return prev
  }, {} as T)

  const refProps = toRef(props)
  return computed(() => {
    const preservedProps = {} as T
    const assignedProps = vm?.vnode.props ?? {}

    Object.keys(assignedProps).forEach((key) => {
      preservedProps[camelize(key) as keyof T] = assignedProps[key]
    })

    return Object.keys({ ...defaultProps, ...preservedProps }).reduce((prev, curr) => {
      if (refProps.value[curr] !== undefined)
        (prev as Record<string, any>)[curr] = refProps.value[curr]
      return prev
    }, {} as WithOptionalBooleans<T>)
  })
}
