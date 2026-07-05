import { parseArgs } from 'node:util'
import { resolve } from 'node:path'
import { add } from './commands/add.js'
import { init } from './commands/init.js'
import { list } from './commands/list.js'
import { view } from './commands/view.js'
import { info } from './commands/info.js'
import { styles } from './commands/styles.js'
import { patchVueLynx } from './commands/patch-vue-lynx.js'
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
  vyui patch-vue-lynx [options]

${c.bold('Commands')}
  init                 Set up vyui.config.json + shared library files
  add <component...>   Copy components (and their dependencies) into the project
  list [query]         List or search available components
  search [query]       Alias for list
  view <component...>  Print registry component source before installing
  info                 Show detected project and VyUI configuration
  styles               List the styles available in the registry
  patch-vue-lynx       Add the temporary vue-lynx MT worklet loader patch

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
    case 'search':
      await list({ cwd, query: rest.join(' '), registry: values.registry, style: values.style })
      break
    case 'view':
      await view({ cwd, components: rest, registry: values.registry, style: values.style })
      break
    case 'info':
      info({ cwd, json: values.json })
      break
    case 'styles':
      await styles({ cwd, registry: values.registry })
      break
    case 'patch-vue-lynx':
      patchVueLynx({ cwd, overwrite: values.overwrite, dryRun: values['dry-run'] })
      break
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
