import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { BASE_COLORS, DEFAULT_BASE_COLOR, GRAY_SENTINEL, configPath, defaultConfig, detectTsconfigAlias, hasPathsEntryForPrefix, readConfig, resolveRegistry, styleRegistry, writeConfig } from '../config.js'
import { detectProject } from '../project-info.js'
import { fetchItem, fetchStyles } from '../registry.js'
import { applyProjectUpdates, planProjectUpdates } from '../update-project.js'
import { writeFiles } from '../write-files.js'
import { confirm, detectPackageManager, installDeps, log, prompt, c } from '../utils.js'

export interface InitOptions {
  registry?: string
  style?: string
  baseColor?: string
  yes?: boolean
  skipInstall?: boolean
  overwrite?: boolean
  dryRun?: boolean
  cwd: string
}

export async function init(opts: InitOptions): Promise<void> {
  const { cwd } = opts
  const existing = readConfig(cwd)
  let overwrite = opts.overwrite ?? false

  if (existing && !overwrite && !opts.dryRun) {
    const go = !opts.yes && await confirm(`${configPath(cwd)} already exists. Reconfigure it?`, false)
    if (!go) {
      log.warn('Existing configuration left unchanged. Pass --overwrite to reconfigure.')
      return
    }
    overwrite = true
  }

  const registry = resolveRegistry(cwd, { registry: opts.registry }, existing).base

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

  // Prefer the real alias declared in tsconfig/jsconfig `compilerOptions.paths`;
  // fall back to a hardcoded `@` + an `src`-existence guess when none is found.
  const project = detectProject(cwd)
  if (!project.packageJson && !opts.skipInstall) {
    throw new Error(`No package.json found in ${cwd}. Create one or pass --skip-install.`)
  }
  if (!project.isVueLynx) log.warn('Could not confirm this is a Vue-Lynx project. Continuing with generic Vue wiring.')
  if (project.appEntry) log.info(`Detected app entry ${c.cyan(project.appEntry)}`)
  if (project.tailwindConfig) log.info(`Detected Tailwind config ${c.cyan(project.tailwindConfig)}`)
  if (project.css) log.info(`Detected global CSS ${c.cyan(project.css)}`)

  const detected = project.alias ?? detectTsconfigAlias(cwd)
  if (detected) log.info(`Detected alias ${c.bold(`${detected.prefix}/*`)} → ${c.cyan(`${detected.srcDir}/`)} from tsconfig/jsconfig`)
  const defaultPrefix = detected?.prefix ?? '@'
  const defaultSrcDir = detected?.srcDir ?? (existsSync(join(cwd, 'src')) ? 'src' : '.')

  const prefix = opts.yes ? defaultPrefix : await prompt('Import alias prefix?', defaultPrefix)
  const srcDir = opts.yes ? defaultSrcDir : await prompt('Source directory?', defaultSrcDir)
  // Explicit `--base-color` flag wins; else prompt (default `slate`), or take
  // the default under `-y`. This is the neutral/gray palette the
  // `__VYUI_GRAY__` sentinel in `style.css` / `plugin.ts` is substituted for.
  const baseColor = opts.baseColor ?? (opts.yes ? DEFAULT_BASE_COLOR : await prompt('Base gray color?', DEFAULT_BASE_COLOR))
  if (!BASE_COLORS.includes(baseColor)) {
    throw new Error(`Unknown base color "${baseColor}". Available: ${BASE_COLORS.join(', ')}`)
  }

  // Bundler aliases (vite/webpack) won't show up in tsconfig, so warn rather than fail.
  if (!hasPathsEntryForPrefix(cwd, prefix)) {
    log.warn(`No tsconfig/jsconfig "paths" entry found for "${prefix}/*". Imports may not resolve unless you have a matching bundler alias.`)
  }

  log.info('Fetching shared library (init payload)…')
  const config = defaultConfig(registry, style, srcDir, prefix, baseColor, {
    tailwindConfig: project.tailwindConfig,
    css: project.css,
  })
  const initItem = await fetchItem(styleRegistry(config), 'init')

  // `--base-color` only does anything if the style's `style.css` carries the
  // `__VYUI_GRAY__` sentinel for `writeFiles` to substitute. Styles that ship a
  // designed palette of their own (e.g. `luna`, whose greys ARE the style) hold
  // literal values instead, so the flag would silently no-op. Say so rather
  // than letting the user believe it applied.
  // Only when the user actually picked one — staying on the default is not a
  // choice worth interrupting.
  const choseBaseColor = opts.baseColor !== undefined || baseColor !== DEFAULT_BASE_COLOR
  const styleCss = initItem.files.find(file => file.target === 'style.css')?.content ?? ''
  if (choseBaseColor && !styleCss.includes(GRAY_SENTINEL)) {
    log.warn(`Style "${style}" ships its own neutral palette, so --base-color "${baseColor}" was not applied. Edit the copied style.css to change its greys.`)
  }

  const updatePlan = planProjectUpdates(project, config)

  log.info(opts.dryRun ? 'Previewing changes…' : 'Applying project setup…')
  writeFiles(initItem.files, config, cwd, overwrite, opts.dryRun)
  applyProjectUpdates(updatePlan, cwd, opts.dryRun ?? false)

  if (opts.dryRun) {
    log.ok('Dry run complete. No files were changed.')
    return
  }

  if (!opts.skipInstall) {
    const pm = detectPackageManager(cwd)
    const go = opts.yes || await confirm(`Install ${initItem.dependencies.join(', ')} with ${c.bold(pm)}?`)
    if (go) {
      log.info(`Installing dependencies with ${pm}…`)
      await installDeps(pm, initItem.dependencies, cwd)
      log.ok('Dependencies installed')
    }
  }

  // Commit the config only after registry resolution, project updates, and
  // dependency installation have succeeded. A failed init can then be rerun
  // normally without a stale config blocking recovery.
  writeConfig(cwd, config)
  log.ok(`Wrote ${c.cyan('vyui.config.json')}`)

  printNextSteps()
}

function printNextSteps(): void {
  log.ok('VyUI initialised.')
  console.log(`
  Add components: ${c.cyan('npx @vyui/cli add button')}
  Browse components: ${c.cyan('npx @vyui/cli list')}
`)
}
