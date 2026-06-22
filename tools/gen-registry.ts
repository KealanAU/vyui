/**
 * Generates the shadcn-style component registry consumed by `@vyui/cli`.
 *
 * The registry is namespaced by *style* (à la shadcn's `default` / `new-york`):
 *   apps/docs/public/r/
 *     styles.json            — catalog of available styles
 *     <style>/index.json     — component catalog for that style
 *     <style>/init.json      — shared support payload for that style
 *     <style>/<component>.json
 *
 * A style sources its files from `packages/kit/src` (the canonical `default`
 * style) plus an optional overlay dir. For each file the overlay wins if it
 * exists, else the kit base is used — so a new style is usually just a set of
 * `theme/*.ts` + a `style.css` / preset override, since the component `.vue`
 * files are pure structure and the appearance lives in the theme.
 *
 * Each component manifest inlines the SFC + its theme file, the npm
 * `dependencies` it needs, and the `registryDependencies` (other registry
 * items) it composes. The CLI fetches these over HTTP and writes them into a
 * downstream project, rewriting relative imports to the user's aliases.
 *
 * Usage:
 *   tsx tools/gen-registry.ts          # pilot set (Chip, Avatar, Button, …)
 *   tsx tools/gen-registry.ts --all    # every top-level component
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const kitSrc = resolve(root, 'packages/kit/src')
const outRoot = resolve(root, 'apps/docs/public/r')

const all = process.argv.includes('--all')
/** Pilot set — exercises the full dependency graph (Toast→Button,Avatar; Avatar→Chip). */
const PILOT = ['Chip', 'Avatar', 'Button', 'Accordion', 'Toast']

/** Theme files that belong to the shared `init` payload, not a single component. */
const SHARED_THEME = new Set(['colors', 'icons', 'color-constants', 'index'])

/**
 * Registered styles. `default` is the canonical kit. Add a new style by
 * creating an overlay dir (mirroring `packages/kit/src`) and registering it:
 *   { name: 'shadcn', overlay: resolve(root, 'styles/shadcn') }
 */
interface StyleDef { name: string, overlay?: string }
const STYLES: StyleDef[] = [
  { name: 'default' },
]

// ── version resolution ─────────────────────────────────────────────────────
const kitPkg = JSON.parse(readFileSync(resolve(root, 'packages/kit/package.json'), 'utf8'))
const corePkg = JSON.parse(readFileSync(resolve(root, 'packages/core/package.json'), 'utf8'))
const VERSIONS: Record<string, string> = {
  ...kitPkg.dependencies,
  ...kitPkg.peerDependencies,
  '@vyui/core': `^${corePkg.version}`, // kit lists workspace:^ which can't ship
}
/** Peers the consumer is assumed to already have (don't force-install). */
const ASSUMED = new Set(['vue', 'vue-lynx', 'tailwindcss', '@lynx-js/react'])

/** Map a bare import specifier to its package name + pinned range. */
function toDep(spec: string): { name: string, range: string } | undefined {
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
  if (ASSUMED.has(name)) return undefined
  return { name, range: VERSIONS[name] ?? 'latest' }
}

// ── import parsing ───────────────────────────────────────────────────────────
const IMPORT_RE = /(?:from|import)\s+['"]([^'"]+)['"]/g

function parseImports(content: string): string[] {
  return [...content.matchAll(IMPORT_RE)].map(m => m[1])
}

interface FileEntry { path: string, target: string, type: string, content: string }

/**
 * Walk a source file's imports and accumulate the npm deps + registry-item deps
 * it pulls in. `srcRel` is the file's path relative to `packages/kit/src`
 * (posix) — the CLI uses the same value to resolve relative imports to aliases.
 */
function collect(srcRel: string, content: string, deps: Set<string>, regDeps: Set<string>, themeFiles: Set<string>) {
  for (const spec of parseImports(content)) {
    if (!spec.startsWith('.')) {
      const dep = toDep(spec)
      if (dep) deps.add(`${dep.name}@${dep.range}`)
      continue
    }
    const resolved = posix.normalize(posix.join(posix.dirname(srcRel), spec))
    const [seg0, seg1] = resolved.split('/')
    if (seg0 === 'components' && seg1?.endsWith('.vue')) {
      regDeps.add(kebab(seg1.replace(/\.vue$/, '')))
    }
    else if (seg0 === 'theme' && seg1 && !SHARED_THEME.has(seg1.replace(/\.\w+$/, ''))) {
      themeFiles.add(seg1.replace(/\.\w+$/, ''))
    }
    // composables/* utils/* types plugin theme/{colors,icons,…} → init payload (no edge to emit)
  }
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/** Style-aware file reader: overlay wins, else kit base. */
function makeReader(style: StyleDef) {
  return (rel: string): string => {
    if (style.overlay) {
      const o = join(style.overlay, rel)
      if (existsSync(o)) return readFileSync(o, 'utf8')
    }
    return readFileSync(join(kitSrc, rel), 'utf8')
  }
}

/** Union of component SFC names from the kit base + the style overlay. */
function componentNames(style: StyleDef): string[] {
  const set = new Set<string>()
  const dirs = [join(kitSrc, 'components'), style.overlay && join(style.overlay, 'components')].filter(Boolean) as string[]
  for (const dir of dirs) {
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir)) if (f.endsWith('.vue')) set.add(f.replace(/\.vue$/, ''))
  }
  return [...set].sort()
}

// Minimal plugin: only provides the merged AppConfig. The kit plugin's global
// component auto-registration (`REGISTRY` loop) is dropped — copied components
// are imported explicitly, so it isn't needed and would reference 48 files.
const INIT_PLUGIN = `import type { App, Plugin } from 'vue'
import { defu } from 'defu'
import { APP_CONFIG_KEY, type AppConfig, type VyUIPluginOptions } from './types'
import icons from './theme/icons'

/** Package-level defaults; user options are deep-merged on top via \`defu\`. */
const defaultConfig: AppConfig = {
  ui: { icons, primary: 'green', gray: 'slate' },
}

/**
 * Vue plugin. Provides the merged \`AppConfig\` consumed by \`useAppConfig\`.
 * Register it once with your lib alias, e.g.
 * \`createApp(App).use(VyUI, { ui: { primary: 'blue' } })\`.
 */
export const VyUI: Plugin<VyUIPluginOptions> = {
  install(app: App, options: VyUIPluginOptions = {}) {
    const merged = defu({ ui: options.ui ?? {} }, defaultConfig) as AppConfig
    app.provide(APP_CONFIG_KEY, merged)
  },
}
`

const INIT_SOURCES: Array<{ src?: string, path: string, target: string, type: string, content?: string }> = [
  { src: 'composables/useAppConfig.ts', path: 'composables/useAppConfig.ts', target: 'composables/useAppConfig.ts', type: 'registry:lib' },
  { src: 'composables/useStyledComponent.ts', path: 'composables/useStyledComponent.ts', target: 'composables/useStyledComponent.ts', type: 'registry:lib' },
  { src: 'composables/useComponentIcons.ts', path: 'composables/useComponentIcons.ts', target: 'composables/useComponentIcons.ts', type: 'registry:lib' },
  { src: 'utils/resolveColor.ts', path: 'utils/resolveColor.ts', target: 'utils/resolveColor.ts', type: 'registry:lib' },
  { src: 'utils/tv.ts', path: 'utils/tv.ts', target: 'utils/tv.ts', type: 'registry:lib' },
  { src: 'theme/colors.ts', path: 'theme/colors.ts', target: 'theme/colors.ts', type: 'registry:lib' },
  { src: 'theme/icons.ts', path: 'theme/icons.ts', target: 'theme/icons.ts', type: 'registry:lib' },
  { src: 'theme/color-constants.js', path: 'theme/color-constants.js', target: 'theme/color-constants.js', type: 'registry:lib' },
  { src: 'theme/color-constants.d.ts', path: 'theme/color-constants.d.ts', target: 'theme/color-constants.d.ts', type: 'registry:lib' },
  { src: 'types.ts', path: 'types.ts', target: 'types.ts', type: 'registry:lib' },
  { path: 'plugin.ts', target: 'plugin.ts', type: 'registry:lib', content: INIT_PLUGIN },
  { src: 'style.css', path: 'style.css', target: 'style.css', type: 'registry:style' },
  // Sits at lib/vyui/ root so its relative `./theme/color-constants.js` import
  // resolves to the copied theme dir; the CLI leaves preset imports un-rewritten.
  { src: 'tailwind.js', path: 'tailwind.js', target: 'vyui-preset.js', type: 'registry:preset' },
]

function generateStyle(style: StyleDef) {
  const read = makeReader(style)
  const outDir = join(outRoot, style.name)
  mkdirSync(outDir, { recursive: true })

  const catalog: Array<{ name: string, type: string, dependencies: string[], registryDependencies: string[] }> = []
  const names = componentNames(style).filter(name => all || PILOT.includes(name))

  for (const name of names) {
    const deps = new Set<string>()
    const regDeps = new Set<string>()
    const themeFiles = new Set<string>()
    const vueSrc = read(`components/${name}.vue`)
    collect(`components/${name}.vue`, vueSrc, deps, regDeps, themeFiles)

    const files: FileEntry[] = [
      { path: `components/${name}.vue`, target: `${name}.vue`, type: 'registry:ui', content: vueSrc },
    ]
    for (const themeName of themeFiles) {
      const themeSrc = read(`theme/${themeName}.ts`)
      collect(`theme/${themeName}.ts`, themeSrc, deps, regDeps, themeFiles)
      files.push({ path: `theme/${themeName}.ts`, target: `theme/${themeName}.ts`, type: 'registry:theme', content: themeSrc })
    }

    const manifest = {
      name: kebab(name),
      type: 'registry:ui',
      dependencies: [...deps].sort(),
      registryDependencies: [...regDeps].sort(),
      files,
    }
    writeFileSync(resolve(outDir, `${manifest.name}.json`), `${JSON.stringify(manifest, null, 2)}\n`)
    catalog.push({ name: manifest.name, type: manifest.type, dependencies: manifest.dependencies, registryDependencies: manifest.registryDependencies })
  }

  // init payload
  const initDeps = new Set<string>()
  const initFiles: FileEntry[] = INIT_SOURCES.map((s) => {
    const content = s.content ?? read(s.src!)
    if (s.type === 'registry:lib') collect(s.path, content, initDeps, new Set(), new Set())
    return { path: s.path, target: s.target, type: s.type, content }
  })
  initDeps.add(`@vyui/core@${VERSIONS['@vyui/core']}`) // primitive layer every component imports

  writeFileSync(resolve(outDir, 'init.json'), `${JSON.stringify({
    name: 'init',
    type: 'registry:lib',
    dependencies: [...initDeps].sort(),
    files: initFiles,
  }, null, 2)}\n`)

  writeFileSync(resolve(outDir, 'index.json'), `${JSON.stringify({
    $schema: 'https://vyui.dev/registry-index.json',
    registry: 'https://vyui.dev/r',
    style: style.name,
    components: catalog.sort((a, b) => a.name.localeCompare(b.name)),
  }, null, 2)}\n`)

  console.log(`[gen-registry] style "${style.name}"  components=${catalog.length}  init-files=${initFiles.length}`)
}

// ── generate ──────────────────────────────────────────────────────────────────
rmSync(outRoot, { recursive: true, force: true })
mkdirSync(outRoot, { recursive: true })

for (const style of STYLES) generateStyle(style)

writeFileSync(resolve(outRoot, 'styles.json'), `${JSON.stringify({
  $schema: 'https://vyui.dev/registry-styles.json',
  registry: 'https://vyui.dev/r',
  default: STYLES[0]?.name ?? 'default',
  styles: STYLES.map(s => s.name),
}, null, 2)}\n`)
console.log(`[gen-registry] styles=[${STYLES.map(s => s.name).join(', ')}]  →  ${outRoot}`)
