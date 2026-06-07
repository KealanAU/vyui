import type { MaybeRefOrGetter } from 'vue'
import { computed } from 'vue'
import { useEmitAsProps } from './useEmitAsProps'
import { useForwardProps } from './useForwardProps'

/**
 * Returns a computed object combining the forwarded props with the emit
 * handlers exposed as `onXXX` props.
 * @param props - the props to forward.
 * @param emit - optional emit function whose events become `onXXX` props.
 * @returns a computed of the merged props and emit handlers.
 */
export function useForwardPropsEmits<T extends Record<string, any>, Name extends string>(props: MaybeRefOrGetter<T>, emit?: (name: Name, ...args: any[]) => void) {
  const parsedProps = useForwardProps(props)
  const emitsAsProps = emit ? useEmitAsProps(emit) : {}

  return computed(() => ({
    ...parsedProps.value,
    ...emitsAsProps,
  }))
}
