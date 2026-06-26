import { DEFAULT_REGISTRY, readConfig } from '../config.js'
import { detectProject } from '../project-info.js'
import { c } from '../utils.js'

export interface InfoOptions {
  cwd: string
  /** Emit machine-readable JSON instead of the formatted summary. */
  json?: boolean
}

/** Show the detected project layout and current VyUI configuration. */
export function info(opts: InfoOptions): void {
  const { cwd } = opts
  const project = detectProject(cwd)
  const config = readConfig(cwd)
  if (opts.json) {
    console.log(JSON.stringify({ project, config: config ?? null }, null, 2))
    return
  }
  console.log(`${c.bold('Project')}
  directory:       ${cwd}
  Vue-Lynx:        ${project.isVueLynx ? 'yes' : 'not detected'}
  app entry:       ${project.appEntry ?? 'not detected'}
  Tailwind config: ${project.tailwindConfig ?? 'not detected'}
  global CSS:      ${project.css ?? 'not detected'}
  import alias:    ${project.alias ? `${project.alias.prefix}/* → ${project.alias.srcDir}/*` : 'not detected'}

${c.bold('VyUI')}
  initialized:     ${config ? 'yes' : 'no'}
  style:           ${config?.style ?? '—'}
  base color:      ${config?.baseColor ?? '—'}
  registry:        ${config?.registry ?? DEFAULT_REGISTRY}`)
}
