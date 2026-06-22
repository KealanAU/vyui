import { parseArgs } from 'node:util'
import { add } from './commands/add.js'
import { init } from './commands/init.js'
import { fetchStyles } from './registry.js'
import { readConfig } from './config.js'
import { c, log } from './utils.js'

const DEFAULT_REGISTRY = 'https://vyui.dev/r'

const HELP = `${c.bold('vyui')} — add @vyui/kit styled components to your project

${c.bold('Usage')}
  vyui init [options]
  vyui add <component...> [options]
  vyui styles [options]

${c.bold('Commands')}
  init                 Set up vyui.config.json + shared library files
  add <component...>   Copy components (and their dependencies) into the project
  styles               List the styles available in the registry

${c.bold('Options')}
  --registry <url>     Registry base URL (default https://vyui.dev/r)
  --style <name>       Style to use (init; default from the registry)
  --base-color <name>  Neutral/gray palette (init; e.g. slate, zinc, stone)
  --all                Add every component in the registry (add)
  --overwrite          Overwrite files that already exist
  --skip-install       Don't install npm dependencies
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

  const cwd = values.cwd ? values.cwd : process.cwd()
  const common = {
    cwd,
    yes: values.yes,
    overwrite: values.overwrite,
    skipInstall: values['skip-install'],
  }

  switch (command) {
    case 'init':
      await init({ ...common, registry: values.registry, style: values.style, baseColor: values['base-color'] })
      break
    case 'add':
      await add({ ...common, components: rest, all: values.all })
      break
    case 'styles': {
      const registry = values.registry ?? readConfig(cwd)?.registry ?? DEFAULT_REGISTRY
      const current = readConfig(cwd)?.style
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
