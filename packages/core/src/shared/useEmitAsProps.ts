import { camelize, getCurrentInstance, toHandlerKey } from 'vue'

// Vue doesn't have emits forwarding, in order to bind the emits we have to convert events into `onXXX` handlers
// issue: https://github.com/vuejs/core/issues/5917
/**
 * Converts a component's emitted events into `onXXX` handler props.
 * @param emit - the component's emit function.
 * @returns an object mapping event names to handlers that call `emit`.
 */
export function useEmitAsProps<Name extends string>(
  emit: (name: Name, ...args: any[]) => void,
) {
  const vm = getCurrentInstance()

  const events = vm?.type.emits as Name[]
  const result: Record<string, any> = {}

  if (import.meta.env?.DEV && !events?.length) {
    console.warn(
      `No emitted event found. Please check component: ${vm?.type.__name}`,
    )
  }

  events?.forEach((ev) => {
    result[toHandlerKey(camelize(ev))] = (...arg: any) => emit(ev, ...arg)
  })
  return result
}
