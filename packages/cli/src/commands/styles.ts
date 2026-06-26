import { readConfig, resolveRegistry } from '../config.js'
import { fetchStyles } from '../registry.js'
import { c, log } from '../utils.js'

export interface StylesOptions {
  cwd: string
  registry?: string
}

/** List the styles available at the registry root, flagging default + current. */
export async function styles(opts: StylesOptions): Promise<void> {
  const config = readConfig(opts.cwd)
  const registry = resolveRegistry(opts.cwd, { registry: opts.registry }, config).base
  const current = config?.style
  const { default: def, styles: available } = await fetchStyles(registry)
  log.info(`Styles available at ${c.dim(registry)}:`)
  for (const style of available) {
    const tags = [style === def ? c.dim('(default)') : '', style === current ? c.green('(current)') : ''].filter(Boolean).join(' ')
    console.log(`  ${c.cyan('•')} ${style} ${tags}`)
  }
}
