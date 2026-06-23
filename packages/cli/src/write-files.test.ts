import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RegistryFile, RegistryFileType } from './registry-schema.js'
import { defaultConfig } from './config.js'
import { destFor, writeFiles } from './write-files.js'

function projectDir(): string {
  return mkdtempSync(join(tmpdir(), 'vyui-write-'))
}

function registryFile(type: RegistryFileType, target: string, content = ''): RegistryFile {
  return { path: target, target, type, content }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('destFor', () => {
  it.each([
    ['registry:ui', 'Button.vue', 'src/components/vyui/Button.vue'],
    ['registry:component', 'internal/Items.vue', 'src/components/vyui/internal/Items.vue'],
    ['registry:theme', 'theme/button.ts', 'src/lib/vyui/theme/button.ts'],
    ['registry:lib', 'composables/useX.ts', 'src/lib/vyui/composables/useX.ts'],
    ['registry:lib', 'utils/x.ts', 'src/lib/vyui/utils/x.ts'],
    ['registry:lib', 'types.ts', 'src/lib/vyui/types.ts'],
    ['registry:style', 'style.css', 'src/lib/vyui/style.css'],
    ['registry:preset', 'vyui-preset.js', 'src/lib/vyui/vyui-preset.js'],
  ] as const)('routes %s files', (type, target, expected) => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')

    expect(destFor(registryFile(type, target), config, project)).toBe(resolve(project, expected))
  })

  it.each([
    '../outside.ts',
    'nested/../../outside.ts',
    '/tmp/outside.ts',
    'C:\\temp\\outside.ts',
    '\0outside.ts',
    '.',
  ])('rejects an unsafe registry target: %s', (target) => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')

    expect(() => destFor(registryFile('registry:ui', target), config, project)).toThrow(/Unsafe registry target|escapes|does not name a file/)
  })

  it('rejects configured output roots outside the project', () => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')
    config.paths.components = '../elsewhere'

    expect(() => destFor(registryFile('registry:ui', 'Button.vue'), config, project)).toThrow(/Configured path/)
  })
})

describe('writeFiles', () => {
  it('rewrites aliases and the selected gray palette', () => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '~', 'zinc')
    const file = registryFile(
      'registry:lib',
      'plugin.ts',
      `import x from '@@vyui:utils/x'\nconst gray = '__VYUI_GRAY__'\n`,
    )
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = writeFiles([file], config, project, false)
    const destination = resolve(project, 'src/lib/vyui/plugin.ts')

    expect(result.written).toEqual([destination])
    expect(readFileSync(destination, 'utf8')).toBe(`import x from '~/lib/vyui/utils/x'\nconst gray = 'zinc'\n`)
  })

  it('does not overwrite existing files unless requested', () => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')
    const first = registryFile('registry:ui', 'Button.vue', 'first')
    const second = registryFile('registry:ui', 'Button.vue', 'second')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    writeFiles([first], config, project, false)
    const skipped = writeFiles([second], config, project, false)
    const destination = resolve(project, 'src/components/vyui/Button.vue')

    expect(existsSync(destination)).toBe(true)
    expect(skipped.skipped).toEqual([destination])
    expect(readFileSync(destination, 'utf8')).toBe('first')

    writeFiles([second], config, project, true)
    expect(readFileSync(destination, 'utf8')).toBe('second')
  })

  it('previews writes without touching the filesystem', () => {
    const project = projectDir()
    const config = defaultConfig('/registry', 'default', 'src', '@', 'slate')
    const file = registryFile('registry:ui', 'Button.vue', 'button')
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    const result = writeFiles([file], config, project, false, true)
    const destination = resolve(project, 'src/components/vyui/Button.vue')

    expect(result.planned).toEqual([destination])
    expect(existsSync(destination)).toBe(false)
  })
})
