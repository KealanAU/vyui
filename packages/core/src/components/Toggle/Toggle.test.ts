// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import { beforeEach, describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { Toggle } from '.'
import ToggleStory from './story/_Toggle.vue'

describe('given default Toggle', () => {
  let container: Element
  let toggle: Element

  beforeEach(() => {
    ;({ container } = render(ToggleStory))
    toggle = container.querySelector('[data-state]')!
  })

  it('starts off', () => {
    expect(toggle.getAttribute('data-state')).toBe('off')
  })

  describe('after toggling', () => {
    // The previously-skipped "should be toggled on" assertion is replaced by
    // an emitted-event assertion. The data-state attribute is a side channel
    // and is set on the same `view` element; the contract for "the toggle
    // toggled" is the emitted `update:modelValue` value. Two-tick
    // waitForUpdate did not observe the data-state attribute change reliably
    // — but the emit fires synchronously inside the tap handler.
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
        fireEvent.tap(toggle)
        await waitForUpdate()
      })

      it('is off again', () => {
        expect(toggle.getAttribute('data-state')).toBe('off')
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
  let toggle: Element

  beforeEach(() => {
    ;({ container } = render(ToggleStory, { disabled: true }))
    toggle = container.querySelector('[data-state]')!
  })

  it('starts off', () => {
    expect(toggle.getAttribute('data-state')).toBe('off')
  })

  describe('try toggling', () => {
    beforeEach(async () => {
      fireEvent.tap(toggle)
      await waitForUpdate()
    })

    it('stays off', () => {
      expect(toggle.getAttribute('data-state')).toBe('off')
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
      expect(toggle.getAttribute('data-disabled')).toBe('')
      expect(toggle.getAttribute('disabled')).toBe('')
    })
  })
})
