import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useA11y } from './useA11y'

describe('useA11y', () => {
  it('maps a role to its native trait and exposes the node', () => {
    const a11y = useA11y({ role: 'button' })
    expect(a11y.value).toEqual({
      'accessibility-traits': 'button',
      'accessibility-element': true,
    })
  })

  it('adds role-description for roles without a native trait equivalent', () => {
    const a11y = useA11y({ role: 'checkbox', state: 'unchecked', label: 'Wifi' })
    expect(a11y.value).toMatchObject({
      'accessibility-traits': 'button',
      'accessibility-role-description': 'checkbox',
      'accessibility-value': 'unchecked',
      'accessibility-label': 'Wifi',
      'accessibility-element': true,
    })
  })

  it('overrides the trait with "disabled" when disabled', () => {
    const a11y = useA11y({ role: 'button', disabled: true })
    expect(a11y.value['accessibility-traits']).toBe('disabled')
  })

  it('flags headings', () => {
    const a11y = useA11y({ role: 'heading', label: 'Title' })
    expect(a11y.value).toMatchObject({
      'accessibility-traits': 'header',
      'accessibility-heading': true,
    })
  })

  it('composes a range value as "{now} of {max}"', () => {
    const a11y = useA11y({ role: 'slider', value: { now: 30, max: 100 } })
    expect(a11y.value).toMatchObject({
      'accessibility-traits': 'adjustable',
      'accessibility-value': '30 of 100',
    })
  })

  it('prefers an explicit value.text over now/max', () => {
    const a11y = useA11y({ value: { now: 30, max: 100, text: '30 percent' } })
    expect(a11y.value['accessibility-value']).toBe('30 percent')
  })

  it('hides the node and nothing else when hidden', () => {
    const a11y = useA11y({ role: 'button', label: 'x', hidden: true })
    expect(a11y.value).toEqual({ 'accessibility-elements-hidden': true })
  })

  it('maps tab to the tabbar trait', () => {
    const a11y = useA11y({ role: 'tab' })
    expect(a11y.value['accessibility-traits']).toBe('tabbar')
    expect(a11y.value['accessibility-role-description']).toBe('tab')
  })

  it('maps alert to a valid trait (not the announce-suppressing "updating")', () => {
    const a11y = useA11y({ role: 'alert', label: 'Saved' })
    expect(a11y.value['accessibility-traits']).toBe('none')
    expect(a11y.value['accessibility-role-description']).toBe('alert')
  })

  it('announces "selected" only when selected, never "unselected"', () => {
    expect(useA11y({ role: 'tab', selected: true }).value['accessibility-value']).toBe('selected')
    expect(useA11y({ role: 'tab', selected: false }).value['accessibility-value']).toBeUndefined()
    // role trait is kept (not replaced by a selected trait)
    expect(useA11y({ role: 'tab', selected: true }).value['accessibility-traits']).toBe('tabbar')
  })

  it('sets exclusive focus for modal subtrees', () => {
    const a11y = useA11y({ role: 'dialog', exclusiveFocus: true })
    expect(a11y.value).toMatchObject({
      'accessibility-traits': 'none',
      'accessibility-role-description': 'dialog',
      'accessibility-exclusive-focus': true,
    })
  })

  it('omits accessibility-element for a node with no semantics', () => {
    const a11y = useA11y({})
    expect(a11y.value).toEqual({})
  })

  it('lets element:false opt a semantic node out of the a11y tree', () => {
    const a11y = useA11y({ role: 'button', element: false })
    expect(a11y.value['accessibility-element']).toBeUndefined()
  })

  it('is reactive to its source', () => {
    const open = ref(false)
    const a11y = useA11y(() => ({
      role: 'button',
      state: open.value ? 'expanded' : 'collapsed',
    }))
    expect(a11y.value['accessibility-value']).toBe('collapsed')
    open.value = true
    expect(a11y.value['accessibility-value']).toBe('expanded')
  })
})
