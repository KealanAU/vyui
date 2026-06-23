import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { RegistryItem } from './registry-schema.js'

const root = fileURLToPath(new URL('../../../', import.meta.url))
const publicDir = join(root, 'apps/docs/public')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

describe('published registry contracts', () => {
  it.each([
    'schema.json',
    'registry-index.json',
    'registry-styles.json',
  ])('publishes %s', (name) => {
    const path = join(publicDir, name)
    expect(existsSync(path)).toBe(true)
    expect(readJson<{ $id: string }>(path).$id).toBe(`https://vyui.dev/${name}`)
  })

  it('bakes shadcn UI deltas into init without forking the button theme', () => {
    const defaultButton = readJson<RegistryItem>(join(publicDir, 'r/default/button.json'))
    const shadcnButton = readJson<RegistryItem>(join(publicDir, 'r/shadcn/button.json'))
    const shadcnInit = readJson<RegistryItem>(join(publicDir, 'r/shadcn/init.json'))

    const defaultTheme = defaultButton.files.find(file => file.target === 'theme/button.ts')?.content
    const shadcnTheme = shadcnButton.files.find(file => file.target === 'theme/button.ts')?.content
    const plugin = shadcnInit.files.find(file => file.target === 'plugin.ts')?.content

    expect(shadcnTheme).toBe(defaultTheme)
    expect(plugin).toContain('"primary": "zinc"')
    expect(plugin).toContain('"button": {')
    expect(plugin).toContain('"color": "neutral"')
  })
})
