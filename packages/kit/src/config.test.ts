import { describe, expect, it, vi } from 'vitest'
import { defineVyuiConfig } from './config.js'
import { provideVyUI } from './provide'
import { APP_CONFIG_KEY } from './types'

describe('defineVyuiConfig', () => {
  it('normalizes theme + components into a single ui bag', () => {
    const config = defineVyuiConfig({
      theme: { primary: 'orange', gray: 'stone', colors: ['primary', 'error'] },
      components: { button: { slots: { base: 'rounded-xl' } } },
    })

    expect(config).toEqual({
      ui: {
        primary: 'orange',
        gray: 'stone',
        colors: ['primary', 'error'],
        button: { slots: { base: 'rounded-xl' } },
      },
    })
  })

  it('defaults to an empty ui bag', () => {
    expect(defineVyuiConfig()).toEqual({ ui: {} })
  })

  it('produces a config provideVyUI merges over package defaults', () => {
    const provide = vi.fn()
    provideVyUI({ provide } as any, defineVyuiConfig({ theme: { primary: 'orange' } }))

    const [key, cfg] = provide.mock.calls[0]
    expect(key).toBe(APP_CONFIG_KEY)
    expect(cfg.ui.primary).toBe('orange') // authored
    expect(cfg.ui.gray).toBe('slate') // package default retained
  })
})
