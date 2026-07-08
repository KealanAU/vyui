import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useGraceArea } from './useGraceArea'

describe('useGraceArea', () => {
  it('starts with isPointerInTransit false', () => {
    const trigger = ref(undefined)
    const container = ref(undefined)
    const { isPointerInTransit } = useGraceArea(trigger, container)
    expect(isPointerInTransit.value).toBe(false)
  })

  it('does not flip isPointerInTransit — Lynx has no hover/pointermove', () => {
    const trigger = ref({ invoke: () => ({ exec: () => {} }) })
    const container = ref({ invoke: () => ({ exec: () => {} }) })
    const { isPointerInTransit } = useGraceArea(trigger, container)
    expect(isPointerInTransit.value).toBe(false)
  })

  it('onPointerExit returns a no-op cleanup function', () => {
    const { onPointerExit } = useGraceArea(ref(undefined), ref(undefined))
    const fn = () => {}
    const cleanup = onPointerExit(fn)
    expect(typeof cleanup).toBe('function')
    expect(() => cleanup()).not.toThrow()
  })

  it('never invokes the callback passed to onPointerExit', () => {
    let called = false
    const { onPointerExit } = useGraceArea(ref(undefined), ref(undefined))
    onPointerExit(() => {
      called = true
    })
    expect(called).toBe(false)
  })

  it('does not throw for nullish/undefined element refs', () => {
    expect(() => useGraceArea(ref(undefined), ref(undefined))).not.toThrow()
  })
})
