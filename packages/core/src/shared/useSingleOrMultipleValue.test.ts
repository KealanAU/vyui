// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import type { SingleOrMultipleProps } from './types'
import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useSingleOrMultipleValue } from './useSingleOrMultipleValue'

function setupPropsEmits(defaultProps: SingleOrMultipleProps) {
  const props = reactive(defaultProps)
  const emits = (emitName: string, ...args: any[]) => {
    if (emitName === 'update:modelValue')
      props.modelValue = args[0]
  }
  return { props, emits }
}

describe('useSingleOrMultipleValue', () => {
  it('initializes from type and modelValue', () => {
    const props: SingleOrMultipleProps = {
      type: 'single',
      modelValue: 'test',
    }
    const emits = vi.fn()
    const { modelValue } = useSingleOrMultipleValue(props, emits)
    expect(modelValue.value).toBe('test')
  })

  it('changes modelValue for single type', async () => {
    const { props, emits } = setupPropsEmits({
      type: 'single',
      modelValue: 'test',
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toBe('newTest')

    changeModelValue('newTest')
    expect(modelValue.value).toBeUndefined()
  })

  it('changes modelValue for multiple type', () => {
    const { props, emits } = setupPropsEmits({
      type: 'multiple',
      modelValue: ['test'],
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toEqual(['test', 'newTest'])

    changeModelValue('test')
    expect(modelValue.value).toEqual(['newTest'])
  })

  it('infers single type from a string modelValue', () => {
    const { props, emits } = setupPropsEmits({
      modelValue: 'test',
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toEqual('newTest')

    changeModelValue('')
    expect(modelValue.value).toEqual('')
  })

  it('infers multiple type from an array modelValue', () => {
    const { props, emits } = setupPropsEmits({
      modelValue: ['test'],
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toEqual(['test', 'newTest'])

    changeModelValue('test')
    expect(modelValue.value).toEqual(['newTest'])
  })

  it('lets an explicit `single` type override an array modelValue', () => {
    const { props, emits } = setupPropsEmits({
      modelValue: ['test'],
      type: 'single',
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toEqual('newTest')

    changeModelValue('')
    expect(modelValue.value).toEqual('')
  })

  it('lets an explicit `multiple` type override a string modelValue', () => {
    const { props, emits } = setupPropsEmits({
      modelValue: 'test',
      type: 'multiple',
    })
    const { changeModelValue, modelValue } = useSingleOrMultipleValue(props, emits)

    changeModelValue('newTest')
    expect(modelValue.value).toEqual(['test', 'newTest'])

    changeModelValue('test')
    expect(modelValue.value).toEqual(['newTest'])
  })
})
