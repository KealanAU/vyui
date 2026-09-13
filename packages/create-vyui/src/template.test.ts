import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const template = fileURLToPath(new URL('../template', import.meta.url))
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
      '_gitignore',
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

  it('lists core-js in allowBuilds so pnpm 11 installs pass the scripts gate', () => {
    expect(read('pnpm-workspace.yaml')).toContain('core-js:')
  })

  it('never imports the kit barrel, which ships every component on Vue-Lynx', () => {
    for (const file of ['src/index.ts', 'src/App.vue']) {
      expect(read(file), file).not.toMatch(/import \{[^}]*\} from '@vyui\/kit'/)
    }
  })
})
