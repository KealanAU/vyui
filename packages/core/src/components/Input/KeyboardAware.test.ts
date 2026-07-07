// Adapted from lynx-family/lynx-ui (Apache-2.0). Verifies provider/consumer
// wiring without depending on Lynx's platform keyboard event.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

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
    // Flush the 30ms blur-debounce in KeyboardAwareRoot deterministically.
    vi.advanceTimersByTime(30)
    await waitForUpdate()
    expect(rootRef.value.__test_focusedRef()).toBeNull()
  })
})

describe('KeyboardAware* — keyboard event routing', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // The root's only working keyboard signal under vue-lynx is the input's
  // per-element @keyboard event — these tests walk it up the whole chain.
  it('feeds the root keyboard height from the input @keyboard event (via Trigger)', async () => {
    const heights: number[] = []
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareResponder, KeyboardAwareTrigger, Input },
      setup: () => ({ value: ref(''), onHeight: (h: number) => heights.push(h) }),
      template: `
        <KeyboardAwareRoot @keyboard-height-change="onHeight">
          <KeyboardAwareResponder>
            <KeyboardAwareTrigger>
              <Input v-model="value" data-testid="ka-input" />
            </KeyboardAwareTrigger>
          </KeyboardAwareResponder>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    const input = container.querySelector('[data-testid="ka-input"]')!

    fireEvent.focus(input, { detail: { value: '' } })
    fireEvent.keyboard(input, { detail: { show: 1, keyBoardHeight: 320, safeAreaBottom: 20 } })
    await waitForUpdate()
    expect(heights).toContain(320)

    fireEvent.keyboard(input, { detail: { show: 0, keyBoardHeight: 0 } })
    await waitForUpdate()
    expect(heights[heights.length - 1]).toBe(0)
  })

  it('inputs self-register with the root when no Trigger wraps them', async () => {
    const rootRef = ref<any>(null)
    const heights: number[] = []
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareResponder, Input },
      setup: () => ({ rootRef, value: ref(''), onHeight: (h: number) => heights.push(h) }),
      template: `
        <KeyboardAwareRoot ref="rootRef" @keyboard-height-change="onHeight">
          <KeyboardAwareResponder>
            <Input v-model="value" data-testid="ka-input" />
          </KeyboardAwareResponder>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    expect(rootRef.value.__test_focusedRef()).toBeNull()
    const input = container.querySelector('[data-testid="ka-input"]')!

    fireEvent.focus(input, { detail: { value: '' } })
    await waitForUpdate()
    const focused = rootRef.value.__test_focusedRef()
    expect(focused).not.toBeNull()

    fireEvent.keyboard(input, { detail: { show: 1, keyBoardHeight: 336 } })
    await waitForUpdate()
    expect(heights).toContain(336)

    // The self-ref identity must be stable — the root's blur path compares
    // `focusedRef.value === triggerRef` before clearing.
    fireEvent.focus(input, { detail: { value: '' } })
    await waitForUpdate()
    expect(rootRef.value.__test_focusedRef()).toBe(focused)

    fireEvent.blur(input, { detail: { value: '' } })
    vi.advanceTimersByTime(30)
    await waitForUpdate()
    expect(rootRef.value.__test_focusedRef()).toBeNull()
  })

  it('ignores a stale keyboard-hide from a previously-focused input', async () => {
    const heights: number[] = []
    const { container } = render({
      components: { KeyboardAwareRoot, KeyboardAwareResponder, KeyboardAwareTrigger, Input },
      setup: () => ({ a: ref(''), b: ref(''), onHeight: (h: number) => heights.push(h) }),
      template: `
        <KeyboardAwareRoot @keyboard-height-change="onHeight">
          <KeyboardAwareResponder>
            <KeyboardAwareTrigger>
              <Input v-model="a" data-testid="input-a" />
            </KeyboardAwareTrigger>
            <KeyboardAwareTrigger>
              <Input v-model="b" data-testid="input-b" />
            </KeyboardAwareTrigger>
          </KeyboardAwareResponder>
        </KeyboardAwareRoot>
      `,
    })
    await nextTick()
    const inputA = container.querySelector('[data-testid="input-a"]')!
    const inputB = container.querySelector('[data-testid="input-b"]')!

    fireEvent.focus(inputA, { detail: { value: '' } })
    fireEvent.keyboard(inputA, { detail: { show: 1, keyBoardHeight: 320 } })
    await waitForUpdate()

    // Focus hops to B while the keyboard stays up; A's late hide must not
    // collapse the height B still depends on.
    fireEvent.focus(inputB, { detail: { value: '' } })
    await waitForUpdate()
    fireEvent.keyboard(inputA, { detail: { show: 0, keyBoardHeight: 0 } })
    await waitForUpdate()
    expect(heights[heights.length - 1]).toBe(320)

    fireEvent.keyboard(inputB, { detail: { show: 0, keyBoardHeight: 0 } })
    await waitForUpdate()
    expect(heights[heights.length - 1]).toBe(0)
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
