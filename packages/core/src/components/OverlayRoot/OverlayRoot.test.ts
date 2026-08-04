import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, getCurrentInstance, h, inject, onMounted, provide } from 'vue'
import { render, waitForUpdate } from '@vyui/testing-utils'
import OverlayRoot from './OverlayRoot.vue'
import {
  overlayEntries,
  registerOverlay,
  unregisterOverlay,
} from './overlayStore'

// Each test mutates the module-global store; ensure no entry bleeds across.
afterEach(() => {
  overlayEntries.value = []
})

const Host = defineComponent({
  name: 'OverlayHost',
  setup() {
    return () => h(OverlayRoot)
  },
})

describe('overlayRoot', () => {
  it('renders nothing when the store is empty', () => {
    const { container } = render(Host)
    // No wrapper `<view>` around the v-for — one would swallow every touch in
    // its empty regions. Counts painted tags only: v-for anchors are real
    // zero-size nodes, so `container.children` is never 0.
    expect(container.querySelectorAll('view').length).toBe(0)
  })

  it('paints a registered entry through the portal', async () => {
    const { container } = render(Host)
    registerOverlay('entry-1', () =>
      h('view', { 'data-overlay-test': 'a' }, [h('text', null, 'painted')]))
    await waitForUpdate()
    const painted = container.querySelector('[data-overlay-test="a"]')
    expect(painted).not.toBeNull()
    expect(painted!.textContent).toContain('painted')
  })

  it('removes an entry when unregisterOverlay is called', async () => {
    const { container } = render(Host)
    registerOverlay('entry-1', () =>
      h('view', { 'data-overlay-test': 'b' }))
    await waitForUpdate()
    expect(container.querySelector('[data-overlay-test="b"]')).not.toBeNull()

    unregisterOverlay('entry-1')
    await waitForUpdate()
    expect(container.querySelector('[data-overlay-test="b"]')).toBeNull()
    expect(overlayEntries.value.length).toBe(0)
  })

  it('replaces an entry when the same id is registered twice', async () => {
    const { container } = render(Host)
    registerOverlay('entry-1', () =>
      h('view', { 'data-overlay-test': 'first' }, [h('text', null, 'one')]))
    await waitForUpdate()

    registerOverlay('entry-1', () =>
      h('view', { 'data-overlay-test': 'second' }, [h('text', null, 'two')]))
    await waitForUpdate()

    expect(overlayEntries.value.length).toBe(1)
    expect(container.querySelector('[data-overlay-test="first"]')).toBeNull()
    const replaced = container.querySelector('[data-overlay-test="second"]')
    expect(replaced).not.toBeNull()
    expect(replaced!.textContent).toContain('two')
  })

  it('replays the provides chain via collectProvides so portalled content can inject ancestor context', async () => {
    const InjectChild = defineComponent({
      name: 'InjectChild',
      setup() {
        const value = inject<string>('overlay-test-key', 'fallback')
        return () => h('text', { 'data-overlay-test': 'injected' }, value)
      },
    })

    const ProviderHost = defineComponent({
      name: 'ProviderHost',
      setup() {
        provide('overlay-test-key', 'wired')
        const provides = (getCurrentInstance() as
          | { provides?: Record<any, any> }
          | null)?.provides
        // Register on mount so OverlayRoot is mounted in the same pass and
        // can paint the entry on the first render flush.
        onMounted(() => {
          registerOverlay('inject-test', () => h(InjectChild), provides)
        })
        return () => h(OverlayRoot)
      },
    })

    const { container } = render(ProviderHost)
    await waitForUpdate()
    const injected = container.querySelector('[data-overlay-test="injected"]')
    expect(injected).not.toBeNull()
    expect(injected!.textContent).toContain('wired')
  })

  it('stacks multiple overlays in registration order', async () => {
    const { container } = render(Host)
    registerOverlay('e1', () =>
      h('view', { 'data-overlay-test': 'stack-1' }, [h('text', null, '1')]))
    registerOverlay('e2', () =>
      h('view', { 'data-overlay-test': 'stack-2' }, [h('text', null, '2')]))
    registerOverlay('e3', () =>
      h('view', { 'data-overlay-test': 'stack-3' }, [h('text', null, '3')]))
    await waitForUpdate()

    expect(overlayEntries.value.map(e => e.id)).toEqual(['e1', 'e2', 'e3'])
    const painted = container.querySelectorAll('[data-overlay-test^="stack-"]')
    expect(painted.length).toBe(3)
    expect(painted[0].getAttribute('data-overlay-test')).toBe('stack-1')
    expect(painted[1].getAttribute('data-overlay-test')).toBe('stack-2')
    expect(painted[2].getAttribute('data-overlay-test')).toBe('stack-3')
  })
})

/**
 * `OverlayPortal` renders NOTHING in place — it registers its slot and
 * `OverlayRoot` paints it elsewhere. So a component using it has no root
 * element for `class` / `style` to fall through to, and Vue drops them
 * silently: no warning, no error, the styles simply never arrive.
 *
 * `SheetContent` and `SheetBackdrop` shipped that way. Every `@vyui/kit` theme
 * class on a sheet panel — `bg-default`, borders, radius — was discarded, and
 * core's own hardcoded `#fff` / `position: fixed` / `z-index` silently stood in
 * for them, so nothing looked wrong until core stopped shipping color and the
 * panels turned transparent.
 *
 * The contract: use `OverlayPortal`, forward `useAttrs()` onto whatever you
 * render inside it, and set `inheritAttrs: false` so Vue doesn't also try the
 * (nonexistent) root. `DialogContentModal` does the same via `h()`.
 */
describe('OverlayPortal consumers forward attrs', () => {
  it.each(['Sheet/SheetContent.vue', 'Sheet/SheetBackdrop.vue'])('%s', async (file) => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const source = readFileSync(resolve(process.cwd(), 'src/components', file), 'utf8')

    expect(source).toContain('<OverlayPortal>')
    expect(source).toContain('useAttrs()')
    expect(source).toContain('inheritAttrs: false')
    expect(source).toMatch(/v-bind="attrs"/)
  })
})
