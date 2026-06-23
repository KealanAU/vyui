import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { add } from './commands/add.js'
import { init } from './commands/init.js'
import { fetchIndex, fetchItem, fetchStyles } from './registry.js'
import { DEFAULT_REGISTRY, readConfig, resolveRegistryBase, resolveStyleRegistry } from './config.js'
import { detectProject } from './project-info.js'
import { c, log } from './utils.js'

const HELP = `${c.bold('vyui')} — add @vyui/kit styled components to your project

${c.bold('Usage')}
  vyui init [options]
  vyui add <component...> [options]
  vyui list [query] [options]
  vyui search [query] [options]
  vyui view <component...> [options]
  vyui info [options]
  vyui styles [options]

${c.bold('Commands')}
  init                 Set up vyui.config.json + shared library files
  add <component...>   Copy components (and their dependencies) into the project
  list [query]         List or search available components
  search [query]       Alias for list
  view <component...>  Print registry component source before installing
  info                 Show detected project and VyUI configuration
  styles               List the styles available in the registry

${c.bold('Options')}
  --registry <url>     Registry base URL (default https://vyui.dev/r)
  --style <name>       Style to use (init; default from the registry)
  --base-color <name>  Neutral/gray palette (init; e.g. slate, zinc, stone)
  --all                Add every component in the registry (add)
  --overwrite          Overwrite files that already exist
  --skip-install       Don't install npm dependencies
  --dry-run            Preview changes without writing files or installing
  --json               Emit machine-readable output (info)
  -y, --yes            Accept defaults / skip prompts
  --cwd <dir>          Run against another directory
  -h, --help           Show this help
`

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      registry: { type: 'string' },
      style: { type: 'string' },
      'base-color': { type: 'string' },
      all: { type: 'boolean' },
      overwrite: { type: 'boolean' },
      'skip-install': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      json: { type: 'boolean' },
      yes: { type: 'boolean', short: 'y' },
      cwd: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  })

  const [command, ...rest] = positionals
  if (values.help || !command) {
    console.log(HELP)
    return
  }

  const cwd = resolve(values.cwd ?? process.cwd())
  const common = {
    cwd,
    yes: values.yes,
    overwrite: values.overwrite,
    skipInstall: values['skip-install'],
    dryRun: values['dry-run'],
  }

  switch (command) {
    case 'init':
      await init({ ...common, registry: values.registry, style: values.style, baseColor: values['base-color'] })
      break
    case 'add':
      await add({
        ...common,
        components: rest,
        all: values.all,
        registry: values.registry,
        style: values.style,
        baseColor: values['base-color'],
      })
      break
    case 'list':
    case 'search': {
      const registry = resolveStyleRegistry(cwd, { registry: values.registry, style: values.style })
      const index = await fetchIndex(registry)
      const query = rest.join(' ').toLowerCase()
      const components = index.components.filter(component => !query || component.name.includes(query))
      if (!components.length) throw new Error(`No components found${query ? ` for "${query}"` : ''}.`)
      log.info(`${components.length} component${components.length === 1 ? '' : 's'} in ${c.dim(registry)}:`)
      for (const component of components) {
        const deps = component.registryDependencies.length ? c.dim(` → ${component.registryDependencies.join(', ')}`) : ''
        console.log(`  ${c.cyan('•')} ${component.name}${deps}`)
      }
      break
    }
    case 'view': {
      if (!rest.length) throw new Error('Specify at least one component to view.')
      const registry = resolveStyleRegistry(cwd, { registry: values.registry, style: values.style })
      for (const name of rest) {
        const item = await fetchItem(registry, name.toLowerCase())
        console.log(c.bold(`\n# ${item.name}`))
        for (const file of item.files) {
          console.log(c.cyan(`\n--- ${file.target} ---\n`))
          console.log(file.content)
        }
      }
      break
    }
    case 'info': {
      const project = detectProject(cwd)
      const config = readConfig(cwd)
      const output = { project, config: config ?? null }
      if (values.json) {
        console.log(JSON.stringify(output, null, 2))
        break
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
      break
    }
    case 'styles': {
      const config = readConfig(cwd)
      const registry = resolveRegistryBase(values.registry ?? config?.registry ?? DEFAULT_REGISTRY, cwd)
      const current = config?.style
      const { default: def, styles } = await fetchStyles(registry)
      log.info(`Styles available at ${c.dim(registry)}:`)
      for (const s of styles) {
        const tags = [s === def ? c.dim('(default)') : '', s === current ? c.green('(current)') : ''].filter(Boolean).join(' ')
        console.log(`  ${c.cyan('•')} ${s} ${tags}`)
      }
      break
    }
    default:
      log.err(`Unknown command: ${command}`)
      console.log(HELP)
      process.exitCode = 1
  }
}

main().catch((err) => {
  log.err(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
})
