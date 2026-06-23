import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { RegistryFile, RegistryFileType, RegistryIndex, RegistryItem } from './registry-schema.js'

const REGISTRY_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PACKAGE_SPEC = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*@[a-z0-9.*+^~_-]+$/i
const FILE_TYPES = new Set<RegistryFileType>([
  'registry:ui',
  'registry:component',
  'registry:theme',
  'registry:lib',
  'registry:style',
  'registry:preset',
])

/** Fetch a registry item by name from `<registry>/<name>.json`. */
export async function fetchItem(registry: string, name: string): Promise<RegistryItem> {
  assertRegistryName(name)
  const value = await fetchJson(`${registry}/${name}.json`)
  const item = parseRegistryItem(value)
  if (item.name !== name) {
    throw new Error(`registry item name mismatch: requested "${name}", received "${item.name}"`)
  }
  return item
}

export async function fetchIndex(registry: string): Promise<RegistryIndex> {
  const value = await fetchJson(`${registry}/index.json`)
  if (!isRecord(value) || typeof value.registry !== 'string' || !Array.isArray(value.components)) {
    throw new Error('invalid registry index')
  }
  const components = value.components.map((component) => {
    if (
      !isRecord(component)
      || typeof component.name !== 'string'
      || component.type !== 'registry:ui'
      || !isStringArray(component.dependencies)
      || !isStringArray(component.registryDependencies)
    ) {
      throw new Error('invalid registry index component')
    }
    assertRegistryName(component.name)
    assertPackageSpecs(component.dependencies)
    for (const name of component.registryDependencies) assertRegistryName(name)
    return component as unknown as RegistryIndex['components'][number]
  })
  return {
    ...(typeof value.$schema === 'string' ? { $schema: value.$schema } : {}),
    registry: value.registry,
    ...(typeof value.style === 'string' ? { style: value.style } : {}),
    components,
  }
}

/** List available styles from the registry root (`<registryBase>/styles.json`). */
export async function fetchStyles(registryBase: string): Promise<{ default: string, styles: string[] }> {
  const value = await fetchJson(`${registryBase}/styles.json`)
  if (
    !isRecord(value)
    || typeof value.default !== 'string'
    || !isStringArray(value.styles)
    || !value.styles.includes(value.default)
  ) {
    throw new Error('invalid registry styles catalog')
  }
  assertRegistryName(value.default)
  for (const style of value.styles) assertRegistryName(style)
  return { default: value.default, styles: value.styles }
}

/** Supports http(s) registries and local `file://` / filesystem paths (tests). */
async function fetchJson(url: string): Promise<unknown> {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`registry fetch failed (${res.status}): ${url}`)
    return res.json() as Promise<unknown>
  }
  const file = url.startsWith('file:') ? new URL(url) : pathToFileURL(url)
  return JSON.parse(readFileSync(file, 'utf8')) as unknown
}

function assertRegistryName(name: string): void {
  if (!REGISTRY_NAME.test(name)) {
    throw new Error(`invalid registry item name: ${JSON.stringify(name)}`)
  }
}

function parseRegistryItem(value: unknown): RegistryItem {
  if (
    !isRecord(value)
    || typeof value.name !== 'string'
    || (value.type !== 'registry:ui' && value.type !== 'registry:lib')
    || !isStringArray(value.dependencies)
    || (value.registryDependencies !== undefined && !isStringArray(value.registryDependencies))
    || !Array.isArray(value.files)
  ) {
    throw new Error('invalid registry item')
  }

  assertRegistryName(value.name)
  assertPackageSpecs(value.dependencies)
  const registryDependencies = value.registryDependencies ?? []
  for (const name of registryDependencies) assertRegistryName(name)

  return {
    name: value.name,
    type: value.type,
    dependencies: value.dependencies,
    registryDependencies,
    files: value.files.map(parseRegistryFile),
  }
}

function parseRegistryFile(value: unknown): RegistryFile {
  if (
    !isRecord(value)
    || typeof value.path !== 'string'
    || typeof value.target !== 'string'
    || typeof value.type !== 'string'
    || !FILE_TYPES.has(value.type as RegistryFileType)
    || typeof value.content !== 'string'
  ) {
    throw new Error('invalid registry file')
  }
  return value as unknown as RegistryFile
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function assertPackageSpecs(specs: string[]): void {
  for (const spec of specs) {
    if (!PACKAGE_SPEC.test(spec)) {
      throw new Error(`invalid registry package specifier: ${JSON.stringify(spec)}`)
    }
  }
}

/**
 * Resolve the full set of items to install for the requested components:
 * each component + its transitive `registryDependencies`, deduped. The caller
 * adds the shared `init` payload separately.
 */
export async function resolveItems(registry: string, names: string[]): Promise<RegistryItem[]> {
  const seen = new Map<string, RegistryItem>()
  const order: string[] = []
  const state = new Map<string, 'visiting' | 'done'>()

  const visit = async (name: string): Promise<void> => {
    // A visiting node is an ancestor or a concurrently discovered dependency.
    // Returning immediately breaks cycles; the first visit remains responsible
    // for completing that node's dependency walk.
    if (state.has(name)) return

    state.set(name, 'visiting')
    order.push(name)

    try {
      const item = await fetchItem(registry, name)
      seen.set(name, item)
      await Promise.all(item.registryDependencies.map(visit))
      state.set(name, 'done')
    }
    catch (error) {
      state.delete(name)
      throw error
    }
  }

  await Promise.all(names.map(visit))
  return order.map(name => seen.get(name)).filter((item): item is RegistryItem => item !== undefined)
}
