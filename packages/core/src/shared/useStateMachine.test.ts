import { describe, expect, it } from 'vitest'
import { useStateMachine } from './useStateMachine'

// A minimal traffic-light machine used across the transition tests.
const trafficLight = {
  red: { NEXT: 'green' },
  green: { NEXT: 'yellow' },
  yellow: { NEXT: 'red' },
} as const

describe('useStateMachine', () => {
  it('starts in the given initial state', () => {
    const { state } = useStateMachine('red', trafficLight)
    expect(state.value).toBe('red')
  })

  it('transitions state on a valid event', () => {
    const { state, dispatch } = useStateMachine('red', trafficLight)
    dispatch('NEXT')
    expect(state.value).toBe('green')
  })

  it('cycles through the full sequence of valid transitions', () => {
    const { state, dispatch } = useStateMachine('red', trafficLight)
    dispatch('NEXT')
    expect(state.value).toBe('green')
    dispatch('NEXT')
    expect(state.value).toBe('yellow')
    dispatch('NEXT')
    expect(state.value).toBe('red')
  })

  it('ignores an event not defined for the current state', () => {
    const machine = {
      closed: { OPEN: 'open' },
      open: { CLOSE: 'closed' },
    } as const
    const { state, dispatch } = useStateMachine('closed', machine)
    dispatch('CLOSE')
    expect(state.value).toBe('closed')
  })

  it('stays in the current state when dispatching an unrelated event repeatedly', () => {
    const { state, dispatch } = useStateMachine('red', trafficLight)
    dispatch('PREV' as any)
    dispatch('PREV' as any)
    expect(state.value).toBe('red')
  })

  it('supports machines where multiple states share event names with different destinations', () => {
    const machine = {
      idle: { TOGGLE: 'active' },
      active: { TOGGLE: 'idle', RESET: 'idle' },
    } as const
    const { state, dispatch } = useStateMachine('idle', machine)
    dispatch('TOGGLE')
    expect(state.value).toBe('active')
    dispatch('RESET')
    expect(state.value).toBe('idle')
  })

  it('exposes state as a reactive ref that reflects dispatch synchronously', () => {
    const { state, dispatch } = useStateMachine('red', trafficLight)
    const seen: string[] = []
    seen.push(state.value)
    dispatch('NEXT')
    seen.push(state.value)
    expect(seen).toEqual(['red', 'green'])
  })
})
