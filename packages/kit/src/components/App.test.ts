import { defineComponent, h, nextTick, onMounted } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OverlayRoot, type SafeAreaInsets, useSafeArea } from '@vyui/core'
import App from './App.vue'
import { resetColorModeForTesting, useColorMode } from '../composables/useColorMode'

// Non-zero stand-in for what a device container reports, so VyApp's provide and
// its `safeArea: false` opt-out are distinguishable (jsdom reads zero for both).
// The factory below repeats the literal on purpose: vi.mock is hoisted above
// this declaration, so referencing the const inside it throws at import time.
const CONTAINER_INSETS = { top: 47, bottom: 34 }
vi.mock('@vyui/core', async () => ({
  ...await vi.importActual<typeof import('@vyui/core')>('@vyui/core'),
  getSafeAreaInsets: () => ({ top: 47, bottom: 34 }),
}))

// This file mounts via plain `@vue/test-utils` (a real `@vue/runtime-dom` tree,
// not the vue-lynx renderer that `@vyui/testing-utils` render() drives), so
// `@layoutchange` compiles to a plain `addEventListener('layoutchange', …)` —
// dispatch a native Event, not the `bindEvent:*`-prefixed one the Lynx test
// runtime expects.
function layoutchange(init: { detail?: unknown, params?: unknown }): Event {
  return Object.assign(new Event('layoutchange'), init)
}

// The Lynx testing-env element shim doesn't expose `classList`/`attributes`
// the way test-utils reads them, so assert via `getAttribute` (the core-test
// idiom).
const rootAttr = (wrapper: VueWrapper<unknown>, name: string): string =>
  (wrapper.element as Element).getAttribute(name) ?? ''
const rootClasses = (wrapper: VueWrapper<unknown>): string[] =>
  rootAttr(wrapper, 'class').split(/\s+/).filter(Boolean)

describe('VyApp', () => {
  beforeEach(() => {
    resetColorModeForTesting()
  })

  it('renders slot content inside the root view with the theme classes', () => {
    const wrapper = mount(App, {
      props: { overlays: false },
      slots: { default: '<text>hello</text>' },
    })
    expect(rootClasses(wrapper)).toContain('w-full')
    expect(rootClasses(wrapper)).toContain('bg-default')
    expect(wrapper.text()).toContain('hello')
  })

  it('applies the dark class from the color-mode singleton and remounts on mode change', async () => {
    const mounts = vi.fn()
    const Probe = defineComponent({
      setup() {
        onMounted(mounts)
        return () => h('text', 'probe')
      },
    })
    const wrapper = mount(App, {
      props: { overlays: false },
      slots: { default: () => h(Probe) },
    })
    expect(rootClasses(wrapper)).not.toContain('dark')
    expect(mounts).toHaveBeenCalledTimes(1)

    useColorMode().setMode('dark')
    await nextTick()

    expect(rootClasses(wrapper)).toContain('dark')
    // `:key="mode"` — the subtree is remounted, not patched (the Lynx
    // class-only-affects-fresh-mounts contract from useColorMode).
    expect(mounts).toHaveBeenCalledTimes(2)
  })

  it('exposes mode and isDark as slot props', async () => {
    const wrapper = mount(App, {
      props: { overlays: false },
      slots: {
        default: ({ mode, isDark }: { mode: string, isDark: boolean }) =>
          h('text', `${mode}:${isDark}`),
      },
    })
    expect(wrapper.text()).toBe('system:false')
    useColorMode().setMode('dark')
    await nextTick()
    expect(wrapper.text()).toBe('dark:true')
  })

  it('sets --ui-radius only when the radius prop is given', () => {
    const bare = mount(App, { props: { overlays: false } })
    expect(rootAttr(bare, 'style')).not.toContain('--ui-radius')

    const sized = mount(App, { props: { overlays: false, radius: 0.5 } })
    expect(rootAttr(sized, 'style')).toContain('--ui-radius: 0.5rem')
  })

  it('merges consumer class with the theme root slot', () => {
    const wrapper = mount(App, { props: { overlays: false, class: 'pt-16' } })
    expect(rootClasses(wrapper)).toContain('pt-16')
    expect(rootClasses(wrapper)).toContain('bg-default')
  })

  it('mounts the overlay host by default and skips it when overlays=false', () => {
    expect(mount(App).findComponent(OverlayRoot).exists()).toBe(true)
    expect(mount(App, { props: { overlays: false } }).findComponent(OverlayRoot).exists()).toBe(false)
  })

  // Both cases need a NON-ZERO container reading to mean anything: the jsdom
  // container reads zero, so asserting zeros for `safeArea: false` passes even
  // with the opt-out deleted. `getSafeAreaInsets` is mocked (top of file)
  // rather than stubbed through `lynx.__globalProps`, which the env owns —
  // normalizing those props is core's contract, covered in useSafeArea.test.ts.
  describe('safe area', () => {
    const seen: SafeAreaInsets[] = []
    const Probe = defineComponent({
      setup() {
        seen.push(useSafeArea())
        return () => h('text', 'probe')
      },
    })
    const mountWithProbe = (props: Record<string, unknown>) =>
      mount(App, { props: { overlays: false, ...props }, slots: { default: () => h(Probe) } })

    beforeEach(() => {
      seen.length = 0
    })

    it('provides the container insets app-wide', () => {
      mountWithProbe({})
      expect(seen.at(-1)).toEqual(CONTAINER_INSETS)
    })

    it('zeroes the insets for the whole tree when `safeArea` is false', () => {
      mountWithProbe({ safeArea: false })
      expect(seen.at(-1)).toEqual({ top: 0, bottom: 0 })
    })
  })

  describe('viewport-change', () => {
    it('emits width/height from the root layoutchange event detail', () => {
      const wrapper = mount(App, { props: { overlays: false } })
      wrapper.element.dispatchEvent(layoutchange({ detail: { width: 390, height: 844 } }))
      expect(wrapper.emitted('viewport-change')).toEqual([[{ width: 390, height: 844 }]])
    })

    it('falls back to event.params when detail is absent', () => {
      const wrapper = mount(App, { props: { overlays: false } })
      wrapper.element.dispatchEvent(layoutchange({ params: { width: 1024, height: 768 } }))
      expect(wrapper.emitted('viewport-change')).toEqual([[{ width: 1024, height: 768 }]])
    })

    it('does not emit when width/height are missing or non-numeric', () => {
      const wrapper = mount(App, { props: { overlays: false } })
      wrapper.element.dispatchEvent(layoutchange({ detail: {} }))
      wrapper.element.dispatchEvent(layoutchange({ detail: { width: '390', height: '844' } }))
      expect(wrapper.emitted('viewport-change')).toBeUndefined()
    })
  })
})
