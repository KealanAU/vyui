import { resolveRegistry } from '../config.js'
import { fetchIndex } from '../registry.js'
import { c, log } from '../utils.js'

export interface ListOptions {
  cwd: string
  /** Optional case-insensitive substring filter on component names. */
  query?: string
  registry?: string
  style?: string
}

/** List (and optionally filter) the components available in the registry. */
export async function list(opts: ListOptions): Promise<void> {
  const registry = resolveRegistry(opts.cwd, { registry: opts.registry, style: opts.style }).styled
  const index = await fetchIndex(registry)
  const query = (opts.query ?? '').toLowerCase()
  const components = index.components.filter(component => !query || component.name.includes(query))
  if (!components.length) throw new Error(`No components found${query ? ` for "${query}"` : ''}.`)
  log.info(`${components.length} component${components.length === 1 ? '' : 's'} in ${c.dim(registry)}:`)
  for (const component of components) {
    const deps = component.registryDependencies.length ? c.dim(` → ${component.registryDependencies.join(', ')}`) : ''
    console.log(`  ${c.cyan('•')} ${component.name}${deps}`)
  }
}
