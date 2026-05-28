// Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui
import type { Ref } from 'vue'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { render, waitForUpdate } from '@vyui/testing-utils'
import ConfigProvider, { injectConfigProviderContext } from './ConfigProvider.vue'

interface CapturedCtx {
  dir?: Ref<string>
  locale?: Ref<string>
}

// A child component that captures the injected ConfigProvider context so the
// test can introspect what the provider actually published. The contract is the
// context values, not the rendered output.
function makeProbe() {
  let captured: CapturedCtx | undefined
  const Probe = defineComponent({
    name: 'ContextProbe',
    setup() {
      captured = injectConfigProviderContext() as CapturedCtx
      return () => h('view', { 'data-testid': 'probe' })
    },
  })
  return { Probe, get: () => captured }
}

describe('ConfigProvider', () => {
  it('renders its default slot', async () => {
    const { container } = render({
      components: { ConfigProvider },
      template: `<ConfigProvider><view data-testid="child">hello</view></ConfigProvider>`,
    })
    await waitForUpdate()
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull()
  })

  it('defaults to dir="ltr" and locale="en"', async () => {
    const { Probe, get } = makeProbe()
    render({
      components: { ConfigProvider, Probe },
      template: `<ConfigProvider><Probe /></ConfigProvider>`,
    })
    await waitForUpdate()
    const ctx = get()
    expect(ctx?.dir?.value).toBe('ltr')
    expect(ctx?.locale?.value).toBe('en')
  })

  it('propagates dir="rtl" via context', async () => {
    const { Probe, get } = makeProbe()
    render({
      components: { ConfigProvider, Probe },
      template: `<ConfigProvider dir="rtl"><Probe /></ConfigProvider>`,
    })
    await waitForUpdate()
    expect(get()?.dir?.value).toBe('rtl')
  })

  it('propagates locale="fr" via context', async () => {
    const { Probe, get } = makeProbe()
    render({
      components: { ConfigProvider, Probe },
      template: `<ConfigProvider locale="fr"><Probe /></ConfigProvider>`,
    })
    await waitForUpdate()
    expect(get()?.locale?.value).toBe('fr')
  })
})
