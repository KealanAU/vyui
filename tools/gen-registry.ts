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
 * exists, else the kit base is used.
 *
 * STYLING CASCADE — author from the cheapest layer up:
 *   1. TOKEN LAYER (primary): an overlay with ONLY `style.css` and/or
 *      `tailwind.js`. Because vyui separates structure (`.vue`) / appearance
 *      (`theme/*.ts`) / tokens (CSS vars + preset), most restyling — radius,
 *      neutral palette, border weight, icon set — is achievable here alone.
 *      Such an overlay reuses ALL base `.vue` + `theme/*.ts` files verbatim;
 *      the `rounded` style below is a worked example (radius + neutral only).
 *   2. THEME DELTA: bake serializable `appConfig.ui` overrides into the
 *      generated plugin. This handles slots, variants, and defaultVariants
 *      without copying the base theme.
 *   3. FULL-FILE OVERLAY (escape hatch): drop in a replacement `theme/*.ts`
 *      (or even a `.vue`) ONLY when a slot's classes or structure must differ
 *      in a way tokens can't express. The overlay wins per file.
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
import { parse as parseSfc } from '@vue/compiler-sfc'
import { init as initLexer, parse as lexImports } from 'es-module-lexer'
import { writeSchemas } from './gen-schemas.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const kitSrc = resolve(root, 'packages/kit/src')
const outRoot = resolve(root, 'apps/docs/public/r')

const all = process.argv.includes('--all')
/** Pilot set — exercises the full dependency graph (Toast→Button,Avatar; Avatar→Chip). */
const PILOT = ['Chip', 'Avatar', 'Button', 'Accordion', 'Toast']

/** Theme files that belong to the shared `init` payload, not a single component. */
const SHARED_THEME = new Set(['colors', 'icons', 'color-constants', 'index'])

/**
 * A style. `overlay` supplies token/file overrides (style.css, preset, or — as
 * an escape hatch — replacement `theme/*.ts` / `.vue`). `appConfig` bakes
 * per-component theme overrides + palette choices into the style's plugin
 * `defaultConfig.ui`; components pick them up at runtime via
 * `appConfig.ui[name]` → `tv({ extend: tv(base), ...overrides })`, so most
 * component restyling needs NO file overlay and never drifts from the base.
 * `default` is the canonical kit; `rounded` demonstrates a token-only overlay.
 */
interface StyleDef { name: string, overlay?: string, appConfig?: Record<string, unknown> }
const STYLES: StyleDef[] = [
  { name: 'default' },
  { name: 'rounded', overlay: resolve(root, 'styles/rounded') },
  {
    name: 'shadcn',
    overlay: resolve(root, 'styles/shadcn'), // tokens only (style.css): primary→zinc, radius 0.5rem
    // The shadcn dark default button is a theme override, NOT a file overlay —
    // merged at runtime via appConfig.ui.button. `primary: 'zinc'` aligns baked
    // SVG icon fills with the zinc CSS-var palette.
    appConfig: {
      primary: 'zinc',
      button: { defaultVariants: { color: 'neutral' } },
    },
  },
]

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
  const range = VERSIONS[name]
  // No `latest` fallback: a shippable dep MUST be declared in kit's package.json,
  // otherwise we'd emit an unpinned (supply-chain-unsafe) specifier.
  if (!range) {
    throw new Error(
      `[gen-registry] unresolved dependency "${name}" (from import "${spec}"). `
      + `Add it to packages/kit/package.json dependencies/peerDependencies, or to ASSUMED.`,
    )
  }
  return { name, range }
}

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

interface FileEntry { path: string, target: string, type: string, content: string }

/** A single import specifier with its exact byte offsets in the source string. */
interface SpecRef { spec: string, start: number, end: number }

/**
 * Extract every import/export specifier (with exact offsets) from a code string.
 * `es-module-lexer` understands `import … from`, `export … from`, dynamic
 * `import()` and type-only forms — and, crucially, ignores specifiers that
 * appear inside comments or strings, so we never rewrite a `from '…'` in a
 * JSDoc block. `s`/`e` are the offsets of the specifier *inside* the quotes.
 */
function lexSpecRefs(code: string): SpecRef[] {
  const [imports] = lexImports(code)
  const refs: SpecRef[] = []
  for (const imp of imports) {
    if (imp.s < 0 || imp.e < 0) continue // e.g. `import.meta` — no specifier
    refs.push({ spec: code.slice(imp.s, imp.e), start: imp.s, end: imp.e })
  }
  return refs
}

/**
 * For a `.vue` SFC, return each `<script>` / `<script setup>` block's source
 * along with its absolute offset within the full SFC string, so specifier
 * offsets discovered inside the block can be mapped back to the whole file.
 */
function sfcScriptBlocks(sfc: string): Array<{ content: string, offset: number }> {
  const { descriptor } = parseSfc(sfc)
  const blocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean)
  return blocks.map(b => ({ content: b!.content, offset: b!.loc.start.offset }))
}

/** Collect import specifier refs from any source file (offsets are file-absolute). */
function specRefsFor(srcRel: string, content: string): SpecRef[] {
  if (srcRel.endsWith('.vue')) {
    const refs: SpecRef[] = []
    for (const block of sfcScriptBlocks(content)) {
      for (const r of lexSpecRefs(block.content)) {
        refs.push({ spec: r.spec, start: r.start + block.offset, end: r.end + block.offset })
      }
    }
    return refs
  }
  return lexSpecRefs(content)
}

/**
 * Classify a kit-relative module path (posix, relative to `packages/kit/src`)
 * into the stable `@@vyui:` placeholder the CLI literal-substitutes back to an
 * alias. Mirrors the alias categories the CLI knows about.
 */
function placeholderFor(resolved: string): string {
  const [seg0, ...rest] = resolved.split('/')
  const tail = rest.join('/')
  switch (seg0) {
    case 'components': return `@@vyui:components/${tail}`
    case 'theme': return `@@vyui:theme/${tail}`
    case 'composables': return `@@vyui:composables/${tail}`
    case 'utils': return `@@vyui:utils/${tail}`
    default: return `@@vyui:lib/${resolved}` // root-level: types, plugin, …
  }
}

/** Resolve a relative specifier from `srcRel` to a kit-src-relative posix path. */
function resolveRel(srcRel: string, spec: string): string {
  return posix.normalize(posix.join(posix.dirname(srcRel), spec))
}

/**
 * Rewrite every RELATIVE import specifier in `content` to its `@@vyui:`
 * placeholder, using the lexer's exact offsets so comments/strings are never
 * touched. Bare specifiers are left verbatim. Used for all code files except
 * preset/style (which keep their relative imports).
 */
function placeholderizeImports(srcRel: string, content: string): string {
  const refs = specRefsFor(srcRel, content).filter(r => r.spec.startsWith('.'))
  if (refs.length === 0) return content
  // Apply right-to-left so earlier offsets stay valid as we splice.
  refs.sort((a, b) => b.start - a.start)
  let out = content
  for (const r of refs) {
    const placeholder = placeholderFor(resolveRel(srcRel, r.spec))
    out = out.slice(0, r.start) + placeholder + out.slice(r.end)
  }
  return out
}

/** Is `resolved` a top-level registry component (`components/<Name>.vue`)? */
function isTopLevelComponent(resolved: string): boolean {
  const parts = resolved.split('/')
  return parts.length === 2 && parts[0] === 'components' && parts[1].endsWith('.vue')
}

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

/** Candidate kit-base path for a (possibly extensionless) relative module. */
function existsRel(rel: string, style: StyleDef): boolean {
  return (style.overlay != null && existsSync(join(style.overlay, rel))) || existsSync(join(kitSrc, rel))
}

const MODULE_EXTS = ['.ts', '.tsx', '.vue', '.js', '.jsx']

/**
 * Resolve a (possibly extensionless) kit-relative module path to the actual
 * source file's kit-relative path with extension — mirroring TS/bundler
 * resolution so `import './islandContext'` finds `islandContext.ts`.
 */
function resolveSourceFile(resolved: string, style: StyleDef): string {
  if (existsRel(resolved, style) && /\.\w+$/.test(resolved)) return resolved
  for (const ext of MODULE_EXTS) {
    if (existsRel(resolved + ext, style)) return resolved + ext
  }
  for (const ext of MODULE_EXTS) {
    if (existsRel(posix.join(resolved, `index${ext}`), style)) return posix.join(resolved, `index${ext}`)
  }
  throw new Error(`[gen-registry] cannot resolve relative module "${resolved}" to a source file`)
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
/**
 * Build the init payload's `plugin.ts` for a style. `icons` (a binding) and
 * `gray` (the `__VYUI_GRAY__` baseColor sentinel) are emitted literally; every
 * other `ui` key — `primary` plus any per-component theme overrides from the
 * style's `appConfig` — is serialized in. These bake the style's look into the
 * provided `AppConfig`, so copied components render it via `useStyledComponent`
 * without any theme-file overlay. With no `appConfig`, output matches `default`.
 */
function makeInitPlugin(appConfig: Record<string, unknown> = {}): string {
  const ui: Record<string, unknown> = { primary: 'green', ...appConfig }
  const styleDefaults = JSON.stringify(ui, null, 2)
  return `import type { App, Plugin } from 'vue'
import { defu } from 'defu'
import { APP_CONFIG_KEY, type AppConfig, type VyUIPluginOptions } from './types'
import icons from './theme/icons'

const styleDefaults = ${styleDefaults}

/**
 * Package-level defaults; user options are deep-merged on top via \`defu\`.
 * Per-component theme overrides baked in here are picked up by each component
 * via \`appConfig.ui[name]\` → \`tv({ extend: tv(base), ...overrides })\`.
 */
const defaultConfig: AppConfig = {
  ui: { icons, gray: '__VYUI_GRAY__', ...styleDefaults },
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
}

/**
 * Replace every `slate` reference in `style.css` with the `__VYUI_GRAY__`
 * sentinel. The CLI substitutes the sentinel for the user's chosen `baseColor`
 * at write time (mirrors the `@@vyui:` import placeholders), which is what
 * actually wires the otherwise-dead `baseColor` config field.
 *
 * Matches ANY `theme('colors.slate.N')` — the fixed neutral ramp (`:root`) AND
 * the per-mode semantic tokens (`--ui-text*` / `--ui-bg*` / `--ui-border*`, both
 * `:root` and `.dark`), so a zinc/stone app gets a matching base gray for BOTH
 * its ramp and its baked tokens (tokens can't `var()`-ref the ramp on Lynx —
 * single-level rule — so this build-time rewrite is how "neutral drives the
 * surfaces/text/borders" actually happens). Safe because `slate` appears ONLY in
 * the neutral ramp + those tokens; the accent ramps use their own palettes
 * (green/blue/…) and `theme('colors.white')` token values are intentionally left
 * literal. With `baseColor: 'slate'` the output is byte-identical to this source.
 */
function grayifySlate(css: string): string {
  return css.replace(
    /(theme\('colors\.)slate(\.\d+'\))/g,
    '$1__VYUI_GRAY__$2',
  )
}

const INIT_SOURCES: Array<{ src?: string, path: string, target: string, type: string, content?: string, transform?: (s: string) => string }> = [
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
  { path: 'plugin.ts', target: 'plugin.ts', type: 'registry:lib' }, // content built per-style via makeInitPlugin
  { src: 'style.css', path: 'style.css', target: 'style.css', type: 'registry:style', transform: grayifySlate },
  // Sits at lib/vyui/ root so its relative `./theme/color-constants.js` import
  // resolves to the copied theme dir; the CLI leaves preset imports un-rewritten.
  { src: 'tailwind.js', path: 'tailwind.js', target: 'vyui-preset.js', type: 'registry:preset' },
]

/**
 * Recursively walk a component's import graph from its top-level SFC.
 *
 * Starting at `components/<Name>.vue`, for each file we:
 *  - add npm `dependencies` for bare specifiers,
 *  - emit a `registryDependencies` edge for *other* top-level components
 *    (kebab name; NOT inlined — the consumer installs them separately),
 *  - INLINE co-located helpers (anything else under `components/`, e.g.
 *    `internal/*.vue`, `*Context.ts`) into this manifest and recurse,
 *  - INLINE non-shared `theme/<name>` files and recurse,
 *  - treat composables/utils/types/plugin/shared-theme as init-payload deps
 *    (no edge — they ship via `init`).
 * A visited set guards cycles (e.g. Island ↔ islandContext, DropdownMenu ↔
 * its internal items which back-reference the parent SFC).
 */
function walkComponent(
  style: StyleDef,
  read: (rel: string) => string,
  rootName: string,
  srcRel: string,
  deps: Set<string>,
  regDeps: Set<string>,
  files: Map<string, FileEntry>,
  visited: Set<string>,
) {
  if (visited.has(srcRel)) return
  visited.add(srcRel)
  const content = read(srcRel)
  for (const ref of specRefsFor(srcRel, content)) {
    const spec = ref.spec
    if (!spec.startsWith('.')) {
      const dep = toDep(spec)
      if (dep) deps.add(`${dep.name}@${dep.range}`)
      continue
    }
    const resolved = resolveRel(srcRel, spec)
    if (isTopLevelComponent(resolved)) {
      const depName = kebab(resolved.split('/')[1].replace(/\.vue$/, ''))
      // Skip self/parent back-references to the component we're generating
      // (e.g. internal/DropdownMenuItems.vue → ../DropdownMenu.vue).
      if (depName !== kebab(rootName)) regDeps.add(depName)
      continue
    }
    const seg0 = resolved.split('/')[0]
    const seg1 = resolveSourceFile(resolved, style).split('/')[1]
    if (seg0 === 'components') {
      // Co-located helper: inline (target is its path relative to components/,
      // with the real file extension) and recurse so its own deps/themes/edges
      // are captured.
      const fileRel = resolveSourceFile(resolved, style)
      if (!files.has(fileRel)) {
        files.set(fileRel, {
          path: fileRel,
          target: fileRel.slice('components/'.length),
          type: 'registry:component',
          content: placeholderizeImports(fileRel, read(fileRel)),
        })
      }
      walkComponent(style, read, rootName, fileRel, deps, regDeps, files, visited)
    }
    else if (seg0 === 'theme' && seg1 && !SHARED_THEME.has(seg1.replace(/\.\w+$/, ''))) {
      const themeRel = resolveSourceFile(resolved, style)
      if (!files.has(themeRel)) {
        files.set(themeRel, {
          path: themeRel,
          target: themeRel,
          type: 'registry:theme',
          content: placeholderizeImports(themeRel, read(themeRel)),
        })
      }
      walkComponent(style, read, rootName, themeRel, deps, regDeps, files, visited)
    }
    // composables/* utils/* types plugin theme/{colors,icons,…} → init payload (no edge)
  }
}

function generateStyle(style: StyleDef) {
  const read = makeReader(style)
  const outDir = join(outRoot, style.name)
  mkdirSync(outDir, { recursive: true })

  const catalog: Array<{ name: string, type: string, dependencies: string[], registryDependencies: string[] }> = []
  const names = componentNames(style).filter(name => all || PILOT.includes(name))

  for (const name of names) {
    const deps = new Set<string>()
    const regDeps = new Set<string>()
    const rootRel = `components/${name}.vue`
    const inlined = new Map<string, FileEntry>() // keyed by kit-relative path
    walkComponent(style, read, name, rootRel, deps, regDeps, inlined, new Set())

    // The top-level SFC is the manifest's primary `registry:ui` file.
    const files: FileEntry[] = [
      { path: rootRel, target: `${name}.vue`, type: 'registry:ui', content: placeholderizeImports(rootRel, read(rootRel)) },
      ...inlined.values(),
    ]

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

  // init payload — these files are flat (no recursion); their relative imports
  // are placeholderized, bare imports become npm deps. preset/style keep
  // relative imports verbatim (no placeholder rewrite).
  const initDeps = new Set<string>()
  const initFiles: FileEntry[] = INIT_SOURCES.map((s) => {
    // plugin.ts is generated per-style so the style's appConfig overrides bake in.
    const source = s.target === 'plugin.ts' ? makeInitPlugin(style.appConfig) : (s.content ?? read(s.src!))
    const raw = s.transform ? s.transform(source) : source
    if (s.type === 'registry:lib') {
      for (const ref of specRefsFor(s.path, raw)) {
        if (!ref.spec.startsWith('.')) {
          const dep = toDep(ref.spec)
          if (dep) initDeps.add(`${dep.name}@${dep.range}`)
        }
      }
    }
    const content = s.type === 'registry:lib' ? placeholderizeImports(s.path, raw) : raw
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

await initLexer // es-module-lexer's wasm must be ready before parse()

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

// Regenerate the published JSON Schemas alongside the registry so the `$schema`
// contracts the manifests reference never drift from the CLI types.
writeSchemas(resolve(outRoot, '..'))
