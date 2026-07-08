import { describe, expect, it } from 'vitest'
import { useKbd, useTestKbd } from './useKbd'

describe('useKbd', () => {
  it('maps named keys to their DOM KeyboardEvent.key values', () => {
    const kbd = useKbd()
    expect(kbd.ENTER).toBe('Enter')
    expect(kbd.ESCAPE).toBe('Escape')
    expect(kbd.ARROW_DOWN).toBe('ArrowDown')
    expect(kbd.ARROW_UP).toBe('ArrowUp')
    expect(kbd.ARROW_LEFT).toBe('ArrowLeft')
    expect(kbd.ARROW_RIGHT).toBe('ArrowRight')
    expect(kbd.TAB).toBe('Tab')
    expect(kbd.SPACE).toBe(' ')
    expect(kbd.HOME).toBe('Home')
    expect(kbd.END).toBe('End')
  })

  it('normalizes CTRL as an alias for CONTROL', () => {
    const kbd = useKbd()
    expect(kbd.CTRL).toBe('Control')
    expect(kbd.CTRL).toBe(kbd.CONTROL)
  })

  it('exposes a distinct SPACE_CODE for the physical "Space" code, separate from the SPACE key value', () => {
    const kbd = useKbd()
    expect(kbd.SPACE).toBe(' ')
    expect(kbd.SPACE_CODE).toBe('Space')
  })

  it('exposes all twelve function keys', () => {
    const kbd = useKbd()
    for (let n = 1; n <= 12; n++) {
      expect(kbd[`F${n}` as keyof typeof kbd]).toBe(`F${n}`)
    }
  })

  it('returns a fresh object on every call (no shared mutable state)', () => {
    const a = useKbd()
    const b = useKbd()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('useTestKbd', () => {
  it('wraps every key name in curly braces for testing-library style key sequences', () => {
    const testKbd = useTestKbd()
    expect(testKbd.ENTER).toBe('{Enter}')
    expect(testKbd.ESCAPE).toBe('{Escape}')
    expect(testKbd.ARROW_DOWN).toBe('{ArrowDown}')
    expect(testKbd.SPACE).toBe('{ }')
  })

  it('special-cases SHIFT_TAB as a held-shift + tab chord', () => {
    const testKbd = useTestKbd()
    expect(testKbd.SHIFT_TAB).toBe('{Shift>}{Tab}')
  })

  it('derives its wrapped values from the same key set as useKbd', () => {
    const kbd = useKbd()
    const testKbd = useTestKbd()
    for (const key of Object.keys(kbd) as (keyof typeof kbd)[])
      expect(testKbd[key]).toBe(`{${kbd[key]}}`)
  })
})
