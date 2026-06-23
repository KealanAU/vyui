import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  defaultConfig,
  detectTsconfigAlias,
  hasPathsEntryForPrefix,
  styleRegistry,
} from './config.js'

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'vyui-config-'))
}

describe('config', () => {
  it('detects aliases from JSONC without corrupting comment-like strings', () => {
    const cwd = tempDir()
    writeFileSync(join(cwd, 'tsconfig.json'), `{
      // Application aliases
      "compilerOptions": {
        "baseUrl": "https://example.com",
        "paths": {
          "~/*": ["./app/*"],
        },
      },
    }`)

    expect(detectTsconfigAlias(cwd)).toEqual({ prefix: '~', srcDir: 'app' })
    expect(hasPathsEntryForPrefix(cwd, '~')).toBe(true)
    expect(hasPathsEntryForPrefix(cwd, '@')).toBe(false)
  })

  it('falls back to jsconfig and normalizes a project-root alias', () => {
    const cwd = tempDir()
    writeFileSync(join(cwd, 'tsconfig.json'), '{ invalid')
    writeFileSync(join(cwd, 'jsconfig.json'), JSON.stringify({
      compilerOptions: {
        paths: {
          '@/*': ['./*'],
        },
      },
    }))

    expect(detectTsconfigAlias(cwd)).toEqual({ prefix: '@', srcDir: '.' })
  })

  it('builds a style-qualified default configuration', () => {
    const config = defaultConfig('/registry', 'shadcn', 'src', '@', 'zinc')

    expect(config.$schema).toBe('https://vyui.dev/schema.json')
    expect(config.paths.components).toBe(join('src', 'components/vyui'))
    expect(config.aliases.theme).toBe('@/lib/vyui/theme')
    expect(config.baseColor).toBe('zinc')
    expect(styleRegistry(config)).toBe('/registry/shadcn')
  })
})
