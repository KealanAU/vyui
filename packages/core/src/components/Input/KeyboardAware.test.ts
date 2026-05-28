// Adapted from lynx-family/lynx-ui (Apache-2.0). Verifies provider/consumer
// wiring without depending on Lynx's platform keyboard event.
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitForUpdate } from '@vyui/testing-utils'
import { defineComponent, h, inject, nextTick, ref } from 'vue'
import {
  Input,
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
} from '.'
import _KeyboardAware from './story/_KeyboardAware.vue'

describe('KeyboardAware* — render', () => {
  it('mounts root + responder + trigger + input without errors', () => {
    const { container } = render(_KeyboardAware)
    expect(container.querySelector('[data-testid="ka-root"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="ka-responder"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="ka-trigger"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="ka-input"]')).not.toBeNull()
  })
})

describe('KeyboardAware* — provider / consumer wiring', () => {
  // A small probe consumer reads each injection key the family publishes and
  // surfaces whether the inject resolved. Mirrors how reka-ui tests verify
  // context plumbing without touching platform internals.
  const RootProbe = defineComponent({
    name: 'RootProbe',
    setup() {
      const ctx = inject(Symbol.for('vyui:KeyboardAwareRootContext'), null) as any
      return () => h('text', { 'data-testid': 'root-probe' }, ctx ? 'ok' : 'missing')
    },
  })

  const TriggerProbe = defineComponent({
    name: 'TriggerProbe',
    setup() {
      const ctx = inject(Symbol.for('vyui:KeyboardAwareTriggerContext'), null) as any
      return () => h('text', { 'data-testid': 'trigger-probe' }, ctx ? 'ok' : 'missing')
    },
  })

  it('KeyboardAwareRoot publishes the root context to descendants', async () => {
    const { container } = render({
      components: { KeyboardAwareRoot, RootProbe },
      template: `<KeyboardAwareRoot><RootProbe /></KeyboardAwareRoot>`,
    })
    await nextTick()
    expect(container.querySelector('[data-testid="root-probe"]')?.textContent).toBe('ok')
  })

  it('KeyboardAwareTrigger publishes the trigger context to descendants', async () => {
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareTrigger, TriggerProbe },
      template: `
        <KeyboardAwareRoot>
          <KeyboardAwareTrigger><TriggerProbe /></KeyboardAwareTrigger>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    expect(container.querySelector('[data-testid="trigger-probe"]')?.textContent).toBe('ok')
  })

  it('Trigger context is absent when Input mounts outside any Trigger', async () => {
    const { container } = render({
      components: { KeyboardAwareRoot, TriggerProbe },
      template: `<KeyboardAwareRoot><TriggerProbe /></KeyboardAwareRoot>`,
    })
    await nextTick()
    expect(container.querySelector('[data-testid="trigger-probe"]')?.textContent).toBe('missing')
  })
})

describe('KeyboardAware* — focus tracking', () => {
  // When the inner Input fires focus, the surrounding Trigger should report
  // up to the Root and become its `__test_focusedRef()`.
  it('marks the focused trigger after the input fires focus', async () => {
    const rootRef = ref<any>(null)
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareResponder, KeyboardAwareTrigger, Input },
      setup: () => ({ rootRef, value: ref('') }),
      template: `
        <KeyboardAwareRoot ref="rootRef">
          <KeyboardAwareResponder>
            <KeyboardAwareTrigger>
              <Input v-model="value" data-testid="ka-input" />
            </KeyboardAwareTrigger>
          </KeyboardAwareResponder>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    expect(rootRef.value.__test_focusedRef()).toBeNull()

    fireEvent.focus(container.querySelector('[data-testid="ka-input"]')!, {
      detail: { value: '' },
    })
    await waitForUpdate()

    expect(rootRef.value.__test_focusedRef()).not.toBeNull()
  })

  it('clears the focused trigger after the input fires blur (after the 30ms delay)', async () => {
    const rootRef = ref<any>(null)
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareResponder, KeyboardAwareTrigger, Input },
      setup: () => ({ rootRef, value: ref('') }),
      template: `
        <KeyboardAwareRoot ref="rootRef">
          <KeyboardAwareResponder>
            <KeyboardAwareTrigger>
              <Input v-model="value" data-testid="ka-input" />
            </KeyboardAwareTrigger>
          </KeyboardAwareResponder>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    fireEvent.focus(container.querySelector('[data-testid="ka-input"]')!, { detail: { value: '' } })
    await waitForUpdate()
    expect(rootRef.value.__test_focusedRef()).not.toBeNull()

    fireEvent.blur(container.querySelector('[data-testid="ka-input"]')!, { detail: { value: '' } })
    // Allow the 30ms blur-debounce in KeyboardAwareRoot to flush.
    await new Promise(resolve => setTimeout(resolve, 40))
    expect(rootRef.value.__test_focusedRef()).toBeNull()
  })
})

describe('KeyboardAware* — root test seam', () => {
  it('exposes __test_setKeyboardStatus to drive the keyboard height in tests', async () => {
    const rootRef = ref<any>(null)
    render({
      components: { KeyboardAwareRoot },
      setup: () => ({ rootRef }),
      template: `<KeyboardAwareRoot ref="rootRef"><text>x</text></KeyboardAwareRoot>`,
    })
    await nextTick()
    expect(rootRef.value).not.toBeNull()
    expect(typeof rootRef.value.__test_setKeyboardStatus).toBe('function')
    // The no-focus path is harmless — it collapses transforms to 0.
    expect(() => rootRef.value.__test_setKeyboardStatus('on', 320)).not.toThrow()
    expect(() => rootRef.value.__test_setKeyboardStatus('off')).not.toThrow()
  })
})
