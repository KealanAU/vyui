import { readConfig } from '../config.js'
import { detectProject } from '../project-info.js'
import { planProjectUpdates } from '../update-project.js'
import { c, log } from '../utils.js'

export interface CheckOptions {
  cwd: string
}

/**
 * Audit an initialised project for the common wiring gaps that bite at runtime.
 * The check is just `planProjectUpdates` in report mode: anything `init` would
 * still change is, by definition, a gap. The headline one is a `pluginVueLynx`
 * missing `includeWorkletPackages`, which crashes the first gesture with
 * `cannot read property 'bind' of undefined`.
 *
 * Read-only and offline — reports gaps and exits non-zero (CI-friendly). Run
 * `init` to apply the fixes.
 */
export function check(opts: CheckOptions): void {
  const { cwd } = opts
  const config = readConfig(cwd)
  if (!config) {
    log.err(`No vyui.config.json in ${cwd}. Run ${c.cyan('npx @vyui/cli init')} first.`)
    process.exitCode = 1
    return
  }
  const project = detectProject(cwd)
  const { updates, warnings } = planProjectUpdates(project, config)
  if (updates.length === 0 && warnings.length === 0) {
    log.ok('VyUI config looks good — no wiring gaps found.')
    return
  }
  for (const update of updates) log.warn(`${update.path} — ${update.description} is missing.`)
  for (const warning of warnings) log.warn(warning)
  log.info(`Run ${c.cyan('npx @vyui/cli init --overwrite')} to apply these, or fix them manually.`)
  process.exitCode = 1
}
