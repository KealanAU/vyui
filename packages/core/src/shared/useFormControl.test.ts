import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useFormControl } from './useFormControl'

describe('useFormControl', () => {
  it('always reports false — Lynx has no HTML form elements to associate with', () => {
    expect(useFormControl(ref(null)).value).toBe(false)
  })

  it('reports false for a nullish element', () => {
    expect(useFormControl(ref(undefined)).value).toBe(false)
  })

  it('reports false even when passed something that looks like a form-associated element', () => {
    const el = ref<any>({ tagName: 'INPUT', form: { id: 'my-form' } })
    expect(useFormControl(el).value).toBe(false)
  })

  it('stays false across changes to the underlying ref', () => {
    const el = ref<any>(null)
    const result = useFormControl(el)
    expect(result.value).toBe(false)
    el.value = { tagName: 'INPUT' }
    expect(result.value).toBe(false)
  })
})
