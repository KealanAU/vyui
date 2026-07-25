import { readConfig, styleRegistry } from '../config.js'
import { init } from './init.js'
import { fetchIndex, fetchItem, resolveItems } from '../registry.js'
import { writeFiles } from '../write-files.js'
import { confirm, detectPackageManager, installDeps, log, prompt, c } from '../utils.js'

export interface AddOptions {
  components: string[]
  all?: boolean
  yes?: boolean
  skipInstall?: boolean
  overwrite?: boolean
  dryRun?: boolean
  registry?: string
  style?: string
  baseColor?: string
  cwd: string
}

export async function add(opts: AddOptions): Promise<void> {
  const { cwd } = opts
  let config = readConfig(cwd)
  if (!config) {
    if (opts.dryRun) throw new Error('No vyui.config.json found. Run `vyui init --dry-run` to preview setup first.')
    const go = opts.yes || (process.stdin.isTTY && await confirm('No vyui.config.json found. Run `vyui init` now?'))
    if (!go) {
      log.err('Run `vyui init` before adding components.')
      process.exitCode = 1
      return
    }
    await init({
      cwd,
      yes: opts.yes,
      skipInstall: opts.skipInstall,
      registry: opts.registry,
      style: opts.style,
      baseColor: opts.baseColor,
    })
    config = readConfig(cwd)
    if (!config) return
  }

  const registry = styleRegistry(config, cwd)
  log.info(`Style ${c.bold(config.style)}`)

  let names = [...new Set(opts.components.map(n => n.toLowerCase()))]
  const index = await fetchIndex(registry)
  if (opts.all) {
    names = index.components.map(c2 => c2.name)
  }
  if (names.length === 0) {
    if (opts.yes || !process.stdin.isTTY) {
      log.err('Specify at least one component, or pass --all.')
      process.exitCode = 1
      return
    }
    console.log(index.components.map(component => `  ${c.cyan('•')} ${component.name}`).join('\n'))
    const answer = await prompt('Which components? (comma-separated)', '')
    names = answer.split(',').map(name => name.trim().toLowerCase()).filter(Boolean)
    if (names.length === 0) return
  }

  const available = index.components.map(component => component.name)
  const unknown = names.filter(name => !available.includes(name))
  if (unknown.length) {
    const quoted = unknown.map(name => `"${name}"`)
    throw new Error(`Unknown component${unknown.length > 1 ? 's' : ''}: ${quoted.join(', ')}. Available: ${available.join(', ')}`)
  }

  log.info(`Resolving ${names.join(', ')}…`)
  const items = await resolveItems(registry, names)
  const resolvedNames = items.map(i => i.name)
  const extra = resolvedNames.filter(n => !names.includes(n))
  if (extra.length) log.info(`Pulling in dependencies: ${extra.join(', ')}`)

  // Ensure shared support files exist (idempotent — skipped if already present).
  const initItem = await fetchItem(registry, 'init')

  // Shared files and transitive dependencies are user-owned once installed:
  // preserve them by default. --overwrite only applies to components the user
  // explicitly requested, matching shadcn's conservative conflict behavior.
  const results = [writeFiles(initItem.files, config, cwd, false, opts.dryRun, false)]
  for (const item of items) {
    const requested = names.includes(item.name)
    results.push(writeFiles(item.files, config, cwd, Boolean(opts.overwrite && requested), opts.dryRun, requested))
  }

  // Union of npm deps across init + every resolved component, deduped by name.
  const deps = dedupeDeps([...initItem.dependencies, ...items.flatMap(i => i.dependencies)])
  if (!opts.dryRun && !opts.skipInstall && deps.length) {
    const pm = detectPackageManager(cwd)
    const go = opts.yes || await confirm(`Install ${deps.join(', ')} with ${c.bold(pm)}?`)
    if (go) {
      log.info(`Installing dependencies with ${pm}…`)
      await installDeps(pm, deps, cwd)
      log.ok('Dependencies installed')
    }
  }

  const written = results.reduce((total, result) => total + result.written.length, 0)
  const skipped = results.reduce((total, result) => total + result.skipped.length, 0)
  const planned = results.reduce((total, result) => total + result.planned.length, 0)
  log.ok(opts.dryRun
    ? `Dry run complete for ${c.bold(resolvedNames.join(', '))}: ${planned} file${planned === 1 ? '' : 's'} would be written, ${skipped} preserved.`
    : `Added ${c.bold(resolvedNames.join(', '))}: ${written} file${written === 1 ? '' : 's'} written, ${skipped} preserved.`)
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
