import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import type { RegistryIndex, RegistryItem } from './registry-schema.js'

/** Fetch a registry item by name from `<registry>/<name>.json`. */
export async function fetchItem(registry: string, name: string): Promise<RegistryItem> {
  return fetchJson<RegistryItem>(`${registry}/${name}.json`)
}

export async function fetchIndex(registry: string): Promise<RegistryIndex> {
  return fetchJson<RegistryIndex>(`${registry}/index.json`)
}

/** List available styles from the registry root (`<registryBase>/styles.json`). */
export async function fetchStyles(registryBase: string): Promise<{ default: string, styles: string[] }> {
  return fetchJson<{ default: string, styles: string[] }>(`${registryBase}/styles.json`)
}

/** Supports http(s) registries and local `file://` / filesystem paths (tests). */
async function fetchJson<T>(url: string): Promise<T> {
  if (url.startsWith('http')) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`registry fetch failed (${res.status}): ${url}`)
    return res.json() as Promise<T>
  }
  const file = url.startsWith('file:') ? new URL(url) : pathToFileURL(url)
  return JSON.parse(readFileSync(file, 'utf8')) as T
}

/**
 * Resolve the full set of items to install for the requested components:
 * each component + its transitive `registryDependencies`, deduped. The caller
 * adds the shared `init` payload separately.
 */
export async function resolveItems(registry: string, names: string[]): Promise<RegistryItem[]> {
  const seen = new Map<string, RegistryItem>()
  const visit = async (name: string): Promise<void> => {
    if (seen.has(name)) return
    const item = await fetchItem(registry, name)
    seen.set(name, item)
    for (const dep of item.registryDependencies) await visit(dep)
  }
  for (const name of names) await visit(name)
  return [...seen.values()]
}
