import type { Ref } from 'vue'
import { ref } from 'vue'

interface Machine<S> {
  [k: string]: { [k: string]: S }
}
type MachineState<T> = keyof T
type MachineEvent<T> = keyof UnionToIntersection<T[keyof T]>

// 🤯 https://fettblog.eu/typescript-union-to-intersection/
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never

/**
 * Creates a state machine, returning the current `state` and a `dispatch`
 * function that transitions it based on events.
 * @param initialState - the machine's starting state.
 * @param machine - maps each state to its events and their next states.
 * @returns `{ state, dispatch }`.
 */
export function useStateMachine<M>(
  initialState: MachineState<M>,
  machine: M & Machine<MachineState<M>>,
) {
  const state = ref(initialState) as Ref<MachineState<M>>

  function reducer(event: MachineEvent<M>) {
    // @ts-expect-error  state.value is keyof M
    const nextState = machine[state.value][event]
    return nextState ?? state.value
  }

  const dispatch = (event: MachineEvent<M>) => {
    state.value = reducer(event)
  }

  return {
    state,
    dispatch,
  }
}
