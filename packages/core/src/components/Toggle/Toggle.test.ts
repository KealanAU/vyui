// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { Toggle } from '.'
import ToggleStory from './story/_Toggle.vue'

describe('given default Toggle', () => {
  let container: Element
  // Re-queried, never captured: the node identity changes across re-render, so
  // a node held from `beforeEach` reads a stale attribute.
  const toggle = () => container.querySelector('[data-state]')!

  beforeEach(() => {
    ;({ container } = render(ToggleStory))
  })

  it('starts off', () => {
    expect(toggle().getAttribute('data-state')).toBe('off')
  })

  describe('after toggling', () => {
    beforeEach(async () => {
      fireEvent.tap(toggle())
      await waitForUpdate()
    })

    it('is on', () => {
      expect(toggle().getAttribute('data-state')).toBe('on')
    })

    it('emits update:modelValue with true on tap', async () => {
      const updates: boolean[] = []
      const { container: c } = render({
        components: { Toggle },
        setup() {
          return { onUpdate: (v: boolean) => updates.push(v) }
        },
        template: `<Toggle @update:model-value="onUpdate">Label</Toggle>`,
      })
      const t = c.querySelector('[data-state]')!
      fireEvent.tap(t)
      await waitForUpdate()
      expect(updates).toEqual([true])
    })

    describe('after toggling again', () => {
      beforeEach(async () => {
        fireEvent.tap(toggle())
        await waitForUpdate()
      })

      it('is off again', () => {
        expect(toggle().getAttribute('data-state')).toBe('off')
      })
    })

    it('emits update:modelValue with false on second tap (when controlled)', async () => {
      const updates: boolean[] = []
      const { container: c } = render({
        components: { Toggle },
        setup() {
          const value = ref(false)
          return {
            value,
            onUpdate: (v: boolean) => {
              updates.push(v)
              value.value = v
            },
          }
        },
        template: `<Toggle :model-value="value" @update:model-value="onUpdate">Label</Toggle>`,
      })
      const t = c.querySelector('[data-state]')!
      fireEvent.tap(t)
      await waitForUpdate()
      fireEvent.tap(t)
      await waitForUpdate()
      expect(updates).toEqual([true, false])
    })
  })
})

describe('given disabled Toggle', () => {
  let container: Element
  const toggle = () => container.querySelector('[data-state]')!

  beforeEach(() => {
    ;({ container } = render(ToggleStory, { disabled: true }))
  })

  it('starts off', () => {
    expect(toggle().getAttribute('data-state')).toBe('off')
  })

  describe('try toggling', () => {
    beforeEach(async () => {
      fireEvent.tap(toggle())
      await waitForUpdate()
    })

    it('stays off', () => {
      expect(toggle().getAttribute('data-state')).toBe('off')
    })

    it('does not emit update:modelValue when disabled', async () => {
      const updates: boolean[] = []
      const { container: c } = render({
        components: { Toggle },
        setup() {
          return { onUpdate: (v: boolean) => updates.push(v) }
        },
        template: `<Toggle disabled @update:model-value="onUpdate">Label</Toggle>`,
      })
      const t = c.querySelector('[data-state]')!
      fireEvent.tap(t)
      await waitForUpdate()
      expect(updates).toEqual([])
    })

    it('renders disabled attributes', () => {
      expect(toggle().getAttribute('data-disabled')).toBe('')
      expect(toggle().getAttribute('disabled')).toBe('')
    })
  })
})
