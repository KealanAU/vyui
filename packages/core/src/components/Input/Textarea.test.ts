// Adapted from lynx-family/lynx-ui (Apache-2.0).
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { nextTick, ref } from 'vue'
import { Textarea } from '.'
import _Textarea from './story/_Textarea.vue'

function ta(container: Element) {
  return container.querySelector('[data-testid="textarea"]') as HTMLTextAreaElement
}

describe('Textarea — default render', () => {
  it('renders a <textarea> with default attrs', () => {
    const { container } = render(_Textarea)
    const el = ta(container)
    expect(el).not.toBeNull()
    expect(el.getAttribute('maxlength')).toBe('100000')
    expect(el.getAttribute('maxlines')).toBe('40')
    expect(el.getAttribute('confirm-type')).toBe('send')
  })

  it('forwards maxLines / lineSpacing / bounces', () => {
    const { container } = render(_Textarea, {
      maxLines: 5,
      lineSpacing: '4px',
      bounces: false,
    })
    const el = ta(container)
    expect(el.getAttribute('maxlines')).toBe('5')
    expect(el.getAttribute('line-spacing')).toBe('4px')
    expect(el.getAttribute('bounces')).toBe('false')
  })
})

describe('Textarea — v-model two-way binding', () => {
  it('reflects initial modelValue', () => {
    const { container } = render(_Textarea, { modelValue: 'lines\nof\ntext' })
    expect(ta(container).getAttribute('value')).toBe('lines\nof\ntext')
  })

  it('emits update:modelValue from a native input event', async () => {
    const { container } = render(_Textarea, { modelValue: '' })
    fireEvent.input(ta(container), { detail: { value: 'next\nrow' } })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('next\nrow')
  })
})

describe('Textarea — disabled / readonly', () => {
  it('renders disabled / readonly attrs and data mirrors', () => {
    const { container } = render(_Textarea, { disabled: true, readonly: true })
    const el = ta(container)
    expect(el.hasAttribute('disabled')).toBe(true)
    expect(el.hasAttribute('readonly')).toBe(true)
    expect(el.getAttribute('data-disabled')).toBe('')
    expect(el.getAttribute('data-readonly')).toBe('')
  })
})

describe('Textarea — selection-change event', () => {
  it('forwards selectionStart/End from the native event detail', async () => {
    const { container } = render(_Textarea)
    // vue-lynx maps `@selection` to the `bindEvent:selection` DOM event in the
    // test runtime (see packages/testing-utils/src/fire-event.ts) — match the
    // exact dispatched name so the listener attached at template-compile
    // time fires.
    const ev = new Event('bindEvent:selection', { bubbles: false })
    Object.assign(ev, { detail: { selectionStart: 1, selectionEnd: 3 } })
    ta(container).dispatchEvent(ev)
    await waitForUpdate()
    expect(container.querySelector('[data-testid="last-selection"]')?.textContent).toBe('[1,3]')
  })
})

describe('Textarea — imperative API', () => {
  it('exposes focus / blur / clear / setValue / getValue / setSelectionRange', async () => {
    const taRef = ref<any>(null)
    render({
      components: { Textarea },
      setup: () => ({ taRef, value: ref('start') }),
      template: `<Textarea ref="taRef" v-model="value" data-testid="textarea" />`,
    })
    await nextTick()
    expect(typeof taRef.value.focus).toBe('function')
    expect(typeof taRef.value.blur).toBe('function')
    expect(typeof taRef.value.clear).toBe('function')
    expect(typeof taRef.value.setValue).toBe('function')
    expect(typeof taRef.value.getValue).toBe('function')
    expect(typeof taRef.value.setSelectionRange).toBe('function')
  })

  it('clear() resets the controlled model to ""', async () => {
    const taRef = ref<any>(null)
    const value = ref('blob')
    render({
      components: { Textarea },
      setup: () => ({ taRef, value }),
      template: `<Textarea ref="taRef" v-model="value" data-testid="textarea" />`,
    })
    await nextTick()
    await taRef.value.clear()
    await nextTick()
    expect(value.value).toBe('')
  })
})
