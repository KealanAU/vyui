import { createApp, defineComponent, inject } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { VyUI } from './plugin'
import { provideVyUI } from './provide'
import { REGISTRY } from './components/registry'
import { APP_CONFIG_KEY, type AppConfig } from './types'

const Noop = defineComponent({ render: () => null })

function readConfig(app: ReturnType<typeof createApp>): AppConfig {
  return app.runWithContext(() => inject(APP_CONFIG_KEY)) as AppConfig
}

describe('VyUI plugin', () => {
  it('provides config merged over defaults and globally registers every component', () => {
    const app = createApp(Noop)
    app.use(VyUI, { ui: { primary: 'orange', gray: 'stone' } })

    const cfg = readConfig(app)
    expect(cfg.ui.primary).toBe('orange')
    expect(cfg.ui.gray).toBe('stone')

    for (const name of Object.keys(REGISTRY)) {
      expect(app.component(name)).toBeTruthy()
    }
  })

  it('registers only the chosen subset when `components` is passed', () => {
    const app = createApp(Noop)
    app.use(VyUI, { components: { VyButton: REGISTRY.VyButton } })

    expect(app.component('VyButton')).toBeTruthy()
    expect(app.component('VyModal')).toBeUndefined()
  })

  // The regression this guards: vue-lynx's createApp returns an app with
  // `provide`/`use` but no `component`, so the old unconditional registration
  // loop threw `app.component is not a function` on device.
  it('stays theme-only without throwing on a Lynx-like app lacking app.component', () => {
    const provide = vi.fn()
    const lynxApp = { provide, use: vi.fn() } as any

    expect(() => VyUI.install!(lynxApp, { ui: { primary: 'orange' } })).not.toThrow()
    expect(provide).toHaveBeenCalledOnce()
    expect(provide).toHaveBeenCalledWith(
      APP_CONFIG_KEY,
      expect.objectContaining({ ui: expect.objectContaining({ primary: 'orange' }) }),
    )
  })
})

describe('provideVyUI', () => {
  it('provides merged config using only app.provide (never app.component)', () => {
    const provide = vi.fn()
    const app = { provide } as any

    expect(() => provideVyUI(app, { ui: { primary: 'blue' } })).not.toThrow()
    expect(provide).toHaveBeenCalledOnce()

    const [key, cfg] = provide.mock.calls[0]
    expect(key).toBe(APP_CONFIG_KEY)
    expect(cfg.ui.primary).toBe('blue')
    expect(cfg.ui.gray).toBe('slate') // package default retained
  })
})
