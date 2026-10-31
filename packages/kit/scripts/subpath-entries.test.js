import { describe, it, expect } from 'vitest'
import { subpathEntries } from './subpath-entries.mjs'

describe('subpathEntries', () => {
  it('lists component, core-backed, and standalone entries', () => {
    const names = [...subpathEntries().keys()]
    expect(names).toEqual(expect.arrayContaining(['button', 'avatar-group', 'aspect-ratio', 'keyboard-aware', 'provide']))
  })

  it('keeps useTray with the tray entry', () => {
    expect(subpathEntries().get('tray').js.join('\n')).toContain('useTray')
  })
})
