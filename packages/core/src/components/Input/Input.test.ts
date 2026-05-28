// Adapted from lynx-family/lynx-ui (Apache-2.0). Assertions verify the
// rendered attributes, the v-model + event contract, and the imperative API
// surfaced via `defineExpose` — not the cross-thread `invoke()` calls (jsdom
// has no `ShadowElement.invoke`, so the component takes the web fallback).
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { nextTick, ref } from 'vue'
import { Input } from '.'
import _Input from './story/_Input.vue'

function input(container: Element) {
  return container.querySelector('[data-testid="input"]') as HTMLInputElement
}

describe('Input — default render', () => {
  it('renders an <input> element with default attrs', () => {
    const { container } = render(_Input)
    const el = input(container)
    expect(el).not.toBeNull()
    expect(el.getAttribute('maxlength')).toBe('140')
    expect(el.getAttribute('confirm-type')).toBe('send')
    expect(el.getAttribute('type')).toBe('text')
  })

  it('forwards placeholder, type, and maxLength', () => {
    const { container } = render(_Input, {
      placeholder: 'Search…',
      type: 'email',
      maxLength: 32,
    })
    const el = input(container)
    expect(el.getAttribute('placeholder')).toBe('Search…')
    expect(el.getAttribute('type')).toBe('email')
    expect(el.getAttribute('maxlength')).toBe('32')
  })

  it('renders disabled / readonly attrs and data-* mirrors', () => {
    const { container } = render(_Input, { disabled: true, readonly: true })
    const el = input(container)
    expect(el.hasAttribute('disabled')).toBe(true)
    expect(el.hasAttribute('readonly')).toBe(true)
    expect(el.getAttribute('data-disabled')).toBe('')
    expect(el.getAttribute('data-readonly')).toBe('')
  })
})

describe('Input — v-model two-way binding', () => {
  it('reflects initial modelValue on the rendered :value', () => {
    const { container } = render(_Input, { modelValue: 'hello' })
    expect(input(container).getAttribute('value')).toBe('hello')
  })

  it('emits update:modelValue from a native input event', async () => {
    const { container } = render(_Input, { modelValue: '' })
    fireEvent.input(input(container), { detail: { value: 'next' } })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('next')
  })

  it('propagates a controlled prop change back into the native attribute', async () => {
    const value = ref('one')
    const { container } = render({
      components: { Input },
      setup: () => ({ value }),
      template: `<Input v-model="value" data-testid="input" />`,
    })
    await waitForUpdate()
    expect(input(container).getAttribute('value')).toBe('one')
    value.value = 'two'
    await waitForUpdate()
    // The :value binding mirrors the new modelValue.
    expect(input(container).getAttribute('value')).toBe('two')
  })
})

describe('Input — disabled prevents emit when consumer guards it', () => {
  // Native input change events fire regardless of `disabled` in jsdom; that
  // matches the Lynx contract (the platform suppresses interaction, not
  // event delivery). What this test verifies is that the `disabled` attr is
  // forwarded so the platform can do its job — see "default render" above.
  it('still emits update:modelValue when disabled (event delivery is platform-owned)', async () => {
    const { container } = render(_Input, { disabled: true })
    fireEvent.input(input(container), { detail: { value: 'x' } })
    await waitForUpdate()
    // The component does not swallow updates — disabled is enforced upstream.
    expect(container.querySelector('[data-testid="value"]')?.textContent).toBe('x')
  })
})

describe('Input — focus / blur / confirm event surfaces', () => {
  it('emits focus and blur with the current value', async () => {
    const { container } = render(_Input, { modelValue: 'abc' })
    fireEvent.focus(input(container), { detail: { value: 'abc' } })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="focus-count"]')?.textContent).toBe('1')
    fireEvent.blur(input(container), { detail: { value: 'abc' } })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="blur-count"]')?.textContent).toBe('1')
  })

  it('emits confirm with the latest value', async () => {
    const { container } = render(_Input)
    fireEvent.input(input(container), { detail: { value: 'go' } })
    await waitForUpdate()
    fireEvent.confirm(input(container), { detail: { value: 'go' } })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="last-confirm"]')?.textContent).toBe('go')
  })
})

describe('Input — imperative API via defineExpose', () => {
  it('exposes focus / blur / clear / setValue / getValue / setSelectionRange', async () => {
    const inputRef = ref<any>(null)
    const value = ref('start')
    render({
      components: { Input },
      setup: () => ({ inputRef, value }),
      template: `<Input ref="inputRef" v-model="value" data-testid="input" />`,
    })
    await nextTick()
    expect(inputRef.value).not.toBeNull()
    expect(typeof inputRef.value.focus).toBe('function')
    expect(typeof inputRef.value.blur).toBe('function')
    expect(typeof inputRef.value.clear).toBe('function')
    expect(typeof inputRef.value.setValue).toBe('function')
    expect(typeof inputRef.value.getValue).toBe('function')
    expect(typeof inputRef.value.setSelectionRange).toBe('function')
  })

  it('clear() resets the controlled model to ""', async () => {
    const inputRef = ref<any>(null)
    const value = ref('start')
    render({
      components: { Input },
      setup: () => ({ inputRef, value }),
      template: `<Input ref="inputRef" v-model="value" data-testid="input" />`,
    })
    await nextTick()
    await inputRef.value.clear()
    await nextTick()
    expect(value.value).toBe('')
  })

  it('getValue() returns the underlying input snapshot on web fallback', async () => {
    const inputRef = ref<any>(null)
    const { container } = render({
      components: { Input },
      setup: () => ({ inputRef, value: ref('hi') }),
      template: `<Input ref="inputRef" v-model="value" data-testid="input" />`,
    })
    await nextTick()
    // The Lynx attribute `value` is a string attribute; jsdom does not mirror
    // it back into the `.value` DOM property unless the user types. Force
    // the property so getValue's web fallback has something to return.
    ;(input(container) as HTMLInputElement).value = 'live'
    const snap = await inputRef.value.getValue()
    expect(snap).toMatchObject({ value: 'live' })
  })
})
