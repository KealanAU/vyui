import { readConfig, styleRegistry } from '../config.js'
import { fetchIndex, fetchItem, resolveItems } from '../registry.js'
import { writeFiles } from '../write-files.js'
import { confirm, detectPackageManager, installDeps, log, c } from '../utils.js'

export interface AddOptions {
  components: string[]
  all?: boolean
  yes?: boolean
  skipInstall?: boolean
  overwrite?: boolean
  cwd: string
}

export async function add(opts: AddOptions): Promise<void> {
  const { cwd } = opts
  const config = readConfig(cwd)
  if (!config) {
    log.err('No vyui.config.json found. Run `vyui init` first.')
    process.exitCode = 1
    return
  }

  const registry = styleRegistry(config)
  log.info(`Style ${c.bold(config.style)}`)

  let names = opts.components.map(n => n.toLowerCase())
  if (opts.all) {
    const index = await fetchIndex(registry)
    names = index.components.map(c2 => c2.name)
  }
  if (names.length === 0) {
    log.err('Specify at least one component, or pass --all.')
    process.exitCode = 1
    return
  }

  log.info(`Resolving ${names.join(', ')}…`)
  const items = await resolveItems(registry, names)
  const resolvedNames = items.map(i => i.name)
  const extra = resolvedNames.filter(n => !names.includes(n))
  if (extra.length) log.info(`Pulling in dependencies: ${extra.join(', ')}`)

  // Ensure shared support files exist (idempotent — skipped if already present).
  const initItem = await fetchItem(registry, 'init')

  const allFiles = [...initItem.files, ...items.flatMap(i => i.files)]
  writeFiles(allFiles, config, cwd, opts.overwrite ?? false)

  // Union of npm deps across init + every resolved component, deduped by name.
  const deps = dedupeDeps([...initItem.dependencies, ...items.flatMap(i => i.dependencies)])
  if (!opts.skipInstall && deps.length) {
    const pm = detectPackageManager(cwd)
    const go = opts.yes || await confirm(`Install ${deps.join(', ')} with ${c.bold(pm)}?`)
    if (go) {
      log.info(`Installing dependencies with ${pm}…`)
      await installDeps(pm, deps, cwd)
      log.ok('Dependencies installed')
    }
  }

  log.ok(`Added ${c.bold(resolvedNames.join(', '))}`)
}

/**
 * Collapse `name@range` specifiers to one per package (first range wins).
 * Warns when two specifiers for the same package disagree on the range.
 * `lastIndexOf('@')` keeps scoped names intact: `@vyui/core@^0.0.6` → `@vyui/core`.
 */
function dedupeDeps(specs: string[]): string[] {
  const byName = new Map<string, string>()
  for (const spec of specs) {
    const at = spec.lastIndexOf('@')
    const name = at > 0 ? spec.slice(0, at) : spec
    const existing = byName.get(name)
    if (existing === undefined) {
      byName.set(name, spec)
    }
    else if (existing !== spec) {
      const existingRange = existing.slice(name.length + 1) || '(unpinned)'
      const newRange = spec.slice(name.length + 1) || '(unpinned)'
      log.warn(`Conflicting versions for ${c.bold(name)}: keeping ${c.bold(existingRange)}, ignoring ${newRange}.`)
    }
  }
  return [...byName.values()].sort()
}
