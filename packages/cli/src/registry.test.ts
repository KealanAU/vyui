import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { RegistryItem } from './registry-schema.js'
import { fetchItem, fetchStyles, resolveItems } from './registry.js'

function registryDir(): string {
  return mkdtempSync(join(tmpdir(), 'vyui-registry-'))
}

function writeItem(root: string, name: string, dependencies: string[]): void {
  mkdirSync(root, { recursive: true })
  const item: RegistryItem = {
    name,
    type: 'registry:ui',
    dependencies: [],
    registryDependencies: dependencies,
    files: [],
  }
  writeFileSync(join(root, `${name}.json`), JSON.stringify(item))
}

describe('resolveItems', () => {
  it('resolves transitive dependencies once in stable discovery order', async () => {
    const root = registryDir()
    writeItem(root, 'dialog', ['button', 'icon'])
    writeItem(root, 'button', ['icon'])
    writeItem(root, 'icon', [])

    const items = await resolveItems(root, ['dialog', 'button'])

    expect(items.map(item => item.name)).toEqual(['dialog', 'button', 'icon'])
  })

  it('terminates cyclic dependency graphs', async () => {
    const root = registryDir()
    writeItem(root, 'a', ['b'])
    writeItem(root, 'b', ['c'])
    writeItem(root, 'c', ['a'])

    const items = await resolveItems(root, ['a'])

    expect(items.map(item => item.name)).toEqual(['a', 'b', 'c'])
  })

  it('supports file URLs', async () => {
    const root = registryDir()
    writeItem(root, 'button', [])

    const items = await resolveItems(pathToFileURL(root).href, ['button'])

    expect(items).toHaveLength(1)
    expect(items[0]?.name).toBe('button')
  })

  it.each([
    '../secret',
    'nested/item',
    'UPPERCASE',
    '',
  ])('rejects unsafe item names before accessing the registry: %s', async (name) => {
    await expect(fetchItem(registryDir(), name)).rejects.toThrow(/invalid registry item name/)
  })

  it('rejects malformed and mismatched manifests', async () => {
    const root = registryDir()
    writeFileSync(join(root, 'broken.json'), JSON.stringify({ name: 'broken', type: 'registry:ui' }))
    writeItem(root, 'actual', [])
    writeFileSync(join(root, 'expected.json'), readFile(root, 'actual.json'))

    await expect(fetchItem(root, 'broken')).rejects.toThrow(/invalid registry item/)
    await expect(fetchItem(root, 'expected')).rejects.toThrow(/name mismatch/)
  })

  it('rejects package-manager option injection from manifests', async () => {
    const root = registryDir()
    const item: RegistryItem = {
      name: 'button',
      type: 'registry:ui',
      dependencies: ['--ignore-scripts'],
      registryDependencies: [],
      files: [],
    }
    writeFileSync(join(root, 'button.json'), JSON.stringify(item))

    await expect(fetchItem(root, 'button')).rejects.toThrow(/invalid registry package specifier/)
  })

  it('requires the default style to exist in the styles catalog', async () => {
    const root = registryDir()
    writeFileSync(join(root, 'styles.json'), JSON.stringify({
      default: 'default',
      styles: ['shadcn'],
    }))

    await expect(fetchStyles(root)).rejects.toThrow(/invalid registry styles catalog/)
  })
})

function readFile(root: string, name: string): string {
  return readFileSync(join(root, name), 'utf8')
}
