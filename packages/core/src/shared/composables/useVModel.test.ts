import { describe, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useVModel } from './useVModel'

function recorder() {
  const calls: any[][] = []
  return { calls, emit: (name: string, ...args: any[]) => { calls.push([name, ...args]) } }
}

describe('useVModel', () => {
  it('reads through the prop and emits on write', () => {
    const props = reactive({ modelValue: 'a' })
    const { calls, emit } = recorder()

    const model = useVModel(props, 'modelValue', emit)
    expect(model.value).toBe('a')

    model.value = 'b'
    expect(calls).toEqual([['update:modelValue', 'b']])
    // Controlled: the value only moves once the parent writes the prop back.
    expect(model.value).toBe('a')
  })

  it('falls back to defaultValue while the prop is undefined', () => {
    const props = reactive<{ modelValue?: number }>({ modelValue: undefined })
    const { emit } = recorder()

    expect(useVModel(props, 'modelValue', emit, { defaultValue: 7 }).value).toBe(7)
  })

  it('passive: emits local writes and absorbs the prop catching up', async () => {
    const props = reactive({ open: false })
    const { calls, emit } = recorder()

    const model = useVModel(props, 'open', emit, { passive: true })
    model.value = true
    await nextTick()
    expect(calls).toEqual([['update:open', true]])

    props.open = true
    await nextTick()
    expect(model.value).toBe(true)
    expect(calls).toHaveLength(1)
  })

  it('passive + deep: emits in-place mutations', async () => {
    const props = reactive<{ modelValue: string[] }>({ modelValue: ['a'] })
    const { calls, emit } = recorder()

    const model = useVModel(props, 'modelValue', emit, { passive: true, deep: true })
    model.value.push('b')
    await nextTick()
    expect(calls).toEqual([['update:modelValue', ['a', 'b']]])
  })
})
