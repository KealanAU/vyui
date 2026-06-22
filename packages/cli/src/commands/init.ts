import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { configPath, defaultConfig, readConfig, styleRegistry, writeConfig, type VyuiConfig } from '../config.js'
import { fetchItem, fetchStyles } from '../registry.js'
import { writeFiles } from '../write-files.js'
import { confirm, detectPackageManager, installDeps, log, prompt, c } from '../utils.js'

const DEFAULT_REGISTRY = 'https://vyui.dev/r'

export interface InitOptions {
  registry?: string
  style?: string
  yes?: boolean
  skipInstall?: boolean
  overwrite?: boolean
  cwd: string
}

export async function init(opts: InitOptions): Promise<void> {
  const { cwd } = opts

  if (readConfig(cwd) && !opts.overwrite) {
    log.warn(`${configPath(cwd)} already exists. Re-run with --overwrite to reconfigure.`)
    return
  }

  const registry = opts.registry ?? DEFAULT_REGISTRY

  // Resolve the style: explicit flag, else prompt from the registry's catalog.
  let available: { default: string, styles: string[] } | undefined
  try {
    available = await fetchStyles(registry)
  }
  catch {
    // Older / offline registry without a styles.json — fall back to `default`.
  }
  const fallbackStyle = available?.default ?? 'default'
  let style = opts.style ?? fallbackStyle
  if (!opts.style && !opts.yes && available && available.styles.length > 1) {
    style = await prompt(`Style? ${c.dim(`[${available.styles.join(', ')}]`)}`, fallbackStyle)
  }
  if (available && !available.styles.includes(style)) {
    log.err(`Unknown style "${style}". Available: ${available.styles.join(', ')}`)
    process.exitCode = 1
    return
  }
  log.info(`Using style ${c.bold(style)}`)

  const srcDir = existsSync(join(cwd, 'src')) ? 'src' : '.'
  const prefix = opts.yes ? '@' : await prompt('Import alias prefix?', '@')
  const baseColor = opts.yes ? 'slate' : await prompt('Base gray color?', 'slate')

  const config = defaultConfig(registry, style, srcDir, prefix, baseColor)
  writeConfig(cwd, config)
  log.ok(`Wrote ${c.cyan('vyui.config.json')}`)

  log.info('Fetching shared library (init payload)…')
  const initItem = await fetchItem(styleRegistry(config), 'init')
  writeFiles(initItem.files, config, cwd, opts.overwrite ?? false)

  if (!opts.skipInstall) {
    const pm = detectPackageManager(cwd)
    const go = opts.yes || await confirm(`Install ${initItem.dependencies.join(', ')} with ${c.bold(pm)}?`)
    if (go) {
      log.info(`Installing dependencies with ${pm}…`)
      await installDeps(pm, initItem.dependencies, cwd)
      log.ok('Dependencies installed')
    }
  }

  printNextSteps(config)
}

function printNextSteps(config: VyuiConfig): void {
  const preset = `${config.aliases.lib}/vyui-preset.js`
  const css = `${config.aliases.lib}/style.css`
  log.ok('vyui initialised. Next steps:')
  console.log(`
  ${c.bold('1.')} Register the plugin in your app entry:
     ${c.dim(`import { VyUI } from '${config.aliases.lib}/plugin'`)}
     ${c.dim(`createApp(App).use(VyUI)`)}

  ${c.bold('2.')} Add the Tailwind preset to ${c.cyan(config.tailwind.config)}:
     ${c.dim(`import vyuiPreset from '${preset}'`)}
     ${c.dim(`export default { presets: [vyuiPreset], content: [...] }`)}

  ${c.bold('3.')} Import the base styles once (e.g. your CSS entry):
     ${c.dim(`@import '${css}';  /* or import in your bundle entry */`)}

  ${c.bold('4.')} Add components:  ${c.cyan('npx @vyui/cli add button')}
`)
}
