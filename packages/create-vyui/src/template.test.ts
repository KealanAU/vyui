import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { isDirEmpty, validName } from './index.js'

const template = join(dirname(fileURLToPath(import.meta.url)), '../template')
const read = (name: string) => readFileSync(join(template, name), 'utf8')

describe('template contract', () => {
  it('ships every file a working Vy UI app needs', () => {
    for (const file of [
      'package.json',
      'pnpm-workspace.yaml',
      'lynx.config.ts',
      'tailwind.config.ts',
      'vyui.config.ts',
      'postcss.config.js',
      'tsconfig.json',
      'src/index.ts',
      'src/index.css',
      'src/App.vue',
      'src/lynx-env.d.ts',
      'src/rspeedy-env.d.ts',
      'README.md',
      '.gitignore',
    ]) {
      expect(existsSync(join(template, file)), file).toBe(true)
    }
  })

  it('wires the five touchpoints an npm install cannot', () => {
    expect(read('lynx.config.ts')).toContain('includeWorkletPackages')
    expect(read('lynx.config.ts')).toContain('@vyui')
    expect(read('tailwind.config.ts')).toContain('createVyuiPreset')
    expect(read('tailwind.config.ts')).toContain('VYUI_UI_STATES')
    expect(read('src/index.css')).toContain("@import '@vyui/kit/style.css'")
    expect(read('src/index.ts')).toContain('provideVyUI')
    expect(read('src/index.ts')).toContain('registerIconSet')
    expect(read('src/index.ts')).toContain('installIntlPolyfill')
    expect(read('src/App.vue')).toContain('OverlayRoot')
    expect(read('src/App.vue')).toContain('ToastProvider')
  })

  it('ships pnpm build approvals so fresh installs pass the scripts gate', () => {
    expect(read('pnpm-workspace.yaml')).toContain('core-js: true')
    const pkg = JSON.parse(read('package.json')) as { pnpm?: unknown }
    expect(pkg.pnpm).toBeUndefined()
  })

  it('imports kit from deep entries so native bundles stay small', () => {
    expect(read('src/App.vue')).toContain('@vyui/kit/button')
    expect(read('src/App.vue')).not.toContain("from '@vyui/kit'")
  })
})

describe('scaffold helpers', () => {
  it('validates app names like npm', () => {
    expect(validName('my-app')).toBe(true)
    expect(validName('@scope/my-app')).toBe(true)
    expect(validName('My App')).toBe(false)
    expect(validName('')).toBe(false)
  })

  it('treats missing dirs as empty', () => {
    expect(isDirEmpty(join(template, '__missing__'))).toBe(true)
    expect(isDirEmpty(template)).toBe(false)
  })
})
