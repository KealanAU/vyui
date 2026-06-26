import { resolveRegistry } from '../config.js'
import { fetchItem } from '../registry.js'
import { c } from '../utils.js'

export interface ViewOptions {
  cwd: string
  components: string[]
  registry?: string
  style?: string
}

/** Print the registry source for one or more components before installing. */
export async function view(opts: ViewOptions): Promise<void> {
  if (!opts.components.length) throw new Error('Specify at least one component to view.')
  const registry = resolveRegistry(opts.cwd, { registry: opts.registry, style: opts.style }).styled
  for (const name of opts.components) {
    const item = await fetchItem(registry, name.toLowerCase())
    console.log(c.bold(`\n# ${item.name}`))
    for (const file of item.files) {
      console.log(c.cyan(`\n--- ${file.target} ---\n`))
      console.log(file.content)
    }
  }
}
