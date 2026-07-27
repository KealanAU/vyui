// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { mount } from '@vue/test-utils'
import { reactivePick } from '@vueuse/core'
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, watch } from 'vue'
import { useForwardProps } from './useForwardProps'

function setupTestComponent(props: Record<string, any>, options = { computed: false }) {
  return defineComponent({
    props,
    emits: ['log'],
    setup(props, { emit }) {
      const payload = options.computed ? computed(() => ({ ...(Object.assign({}, props)) })) : props
      const forwarded = useForwardProps(payload)
      watch(forwarded, () => emit('log', forwarded.value), { immediate: true, deep: true })

      return { forwarded }
    },
    template: '<div>{{ forwarded }}</div>',
  })
}

describe('useForwardProps', () => {
  it('forwards nothing when no props are provided', () => {
    const wrapper = mount(setupTestComponent({ id: String }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({})
  })

  it('forwards default props', () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
  })

  it('forwards provided props over defaults', () => {
    const props = { id: 'new-test', number: 0, enabled: false }
    const wrapper = mount(setupTestComponent(
      { id: { type: String, default: 'test' }, number: Number, enabled: Boolean },
    ), { props })
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual(props)
  })

  it('is reactive', async () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }))
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
    await wrapper.setProps({ id: 'new-test' })
    expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
  })

  it('ignores props not declared on the component', () => {
    const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }), { props: { extra: 'not-related' }, attrs: { class: 'custom' } })
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
  })

  it('forwards only the picked props', async () => {
    const component = defineComponent({
      props: { id: { type: String, default: 'test' }, extra: { type: String, default: 'not-related' } },
      emits: ['log'],
      setup(props, { emit }) {
        const picked = reactivePick(props, 'id')
        const forwarded = useForwardProps(picked)
        watch(forwarded, () => emit('log', forwarded.value), { immediate: true, deep: true })

        return { forwarded }
      },
      template: '<div>{{ forwarded }}</div>',
    })
    const wrapper = mount(component)
    expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
    await wrapper.setProps({ id: 'new-test' })
    expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
  })

  describe('with computedRef', async () => {
    it('is reactive', async () => {
      const wrapper = mount(setupTestComponent({ id: { type: String, default: 'test' } }, { computed: true }))
      expect(wrapper.emitted('log')?.[0][0]).toStrictEqual({ id: 'test' })
      await wrapper.setProps({ id: 'new-test' })
      expect(wrapper.emitted('log')?.[1][0]).toStrictEqual({ id: 'new-test' })
    })
  })
})
