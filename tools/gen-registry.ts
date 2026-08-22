/**
 * Generates the shadcn-style component registry consumed by `@vyui/cli`, into
 * `apps/docs/public/r/<style>/`. A style sources its files from
 * `packages/kit/src` (the canonical `default`) plus an optional overlay dir;
 * per file, the overlay wins if it exists.
 *
 * STYLING CASCADE — author from the cheapest layer up:
 *   1. TOKEN LAYER: an overlay with ONLY `style.css` and/or `tailwind.js`.
 *   2. THEME DELTA: serializable `appConfig.ui` overrides baked into the
 *      generated plugin — no file copies.
 *   3. FULL-FILE OVERLAY: a replacement `theme/*.ts` or `.vue`, only when
 *      tokens can't express it. An overlay REPLACES a kit file, never adds one.
 *
 * Usage:
 *   tsx tools/gen-registry.ts
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

/** Theme files that ship via `init`, not with a single component. */
const SHARED_THEME = new Set(['colors', 'icons', 'color-constants', 'index'])

/**
 * `appConfig` bakes per-component theme overrides + palette choices into the
 * style's plugin `defaultConfig.ui`, read at runtime via `appConfig.ui[name]` →
 * `tv({ extend: tv(base), ...overrides })`. Its `primary` must name the SAME
 * palette the overlay's `--ui-color-primary-*` holds: baked SVG icon fills
 * resolve their hex from it (icons can't read CSS vars — see VyIcon).
 */
interface StyleDef { name: string, overlay?: string, appConfig?: Record<string, unknown> }
const STYLES: StyleDef[] = [
  { name: 'default' },
  { name: 'rounded', overlay: resolve(root, 'styles/rounded') },
  {
    name: 'shadcn',
    overlay: resolve(root, 'styles/shadcn'), // tokens only: primary→zinc, radius 0.5rem
    appConfig: {
      primary: '__VYUI_GRAY__',
      button: { defaultVariants: { color: 'neutral' } },
    },
  },
  {
    name: 'lunaris',
    overlay: resolve(root, 'styles/lunaris'), // tokens only: LUNA signature-gradient variant
    appConfig: { primary: 'rose' },
  },
  {
    name: 'liquid-glass',
    overlay: resolve(root, 'styles/liquid-glass'), // tokens only: translucent iOS surfaces, 14px radius
    appConfig: { primary: 'blue' },
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

function toDep(spec: string): { name: string, range: string } | undefined {
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
  if (ASSUMED.has(name)) return undefined
  const range = VERSIONS[name]
  // No `latest` fallback — that would emit an unpinned (supply-chain-unsafe) specifier.
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

/** An import specifier with its byte offsets *inside the quotes*, file-absolute. */
interface SpecRef { spec: string, start: number, end: number }

function lexSpecRefs(code: string): SpecRef[] {
  const [imports] = lexImports(code)
  const refs: SpecRef[] = []
  for (const imp of imports) {
    if (imp.s < 0 || imp.e < 0) continue // e.g. `import.meta` — no specifier
    refs.push({ spec: code.slice(imp.s, imp.e), start: imp.s, end: imp.e })
  }
  return refs
}

function sfcScriptBlocks(sfc: string): Array<{ content: string, offset: number }> {
  const { descriptor } = parseSfc(sfc)
  const blocks = [descriptor.script, descriptor.scriptSetup].filter(Boolean)
  return blocks.map(b => ({ content: b!.content, offset: b!.loc.start.offset }))
}

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

/** Mirrors the alias categories the CLI literal-substitutes `@@vyui:` back to. */
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

function resolveRel(srcRel: string, spec: string): string {
  return posix.normalize(posix.join(posix.dirname(srcRel), spec))
}

/**
 * Rewrite RELATIVE specifiers to their `@@vyui:` placeholder; bare specifiers
 * stay verbatim. Offsets come from the lexer, so a `from '…'` inside a comment
 * or string is never touched. Not applied to preset/style files, which keep
 * their relative imports.
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

function isTopLevelComponent(resolved: string): boolean {
  const parts = resolved.split('/')
  return parts.length === 2 && parts[0] === 'components' && parts[1].endsWith('.vue')
}

/** Overlay wins, else kit base. */
function makeReader(style: StyleDef) {
  return (rel: string): string => {
    if (style.overlay) {
      const o = join(style.overlay, rel)
      if (existsSync(o)) return readFileSync(o, 'utf8')
    }
    return readFileSync(join(kitSrc, rel), 'utf8')
  }
}

const MODULE_EXTS = ['.ts', '.tsx', '.vue', '.js', '.jsx']

/**
 * Mirror TS/bundler resolution so `import './islandContext'` finds
 * `islandContext.ts`. Kit base only — an overlay replaces a base file, never
 * adds one.
 */
function resolveSourceFile(resolved: string): string {
  const exists = (rel: string) => existsSync(join(kitSrc, rel))
  if (/\.\w+$/.test(resolved) && exists(resolved)) return resolved
  for (const ext of MODULE_EXTS) {
    if (exists(resolved + ext)) return resolved + ext
  }
  for (const ext of MODULE_EXTS) {
    if (exists(posix.join(resolved, `index${ext}`))) return posix.join(resolved, `index${ext}`)
  }
  throw new Error(`[gen-registry] cannot resolve relative module "${resolved}" to a source file`)
}

function componentNames(): string[] {
  return readdirSync(join(kitSrc, 'components'))
    .filter(f => f.endsWith('.vue'))
    .map(f => f.replace(/\.vue$/, ''))
    .sort()
}

/**
 * The init payload's `plugin.ts`. Deliberately minimal: the kit plugin's global
 * component auto-registration is dropped (copied components are imported
 * explicitly, and it would reference 48 files). `icons` (a binding) and `gray`
 * (the `__VYUI_GRAY__` sentinel) are emitted literally; every other `ui` key is
 * serialized in. With no `appConfig`, output matches `default`.
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
 * Swap `slate` for the `__VYUI_GRAY__` sentinel the CLI substitutes with the
 * user's `baseColor` at write time. Matches ANY `theme('colors.slate.N')` — the
 * neutral ramp AND the per-mode semantic tokens, since tokens can't `var()`-ref
 * the ramp on Lynx (single-level rule). `theme('colors.white')` stays literal,
 * and `baseColor: 'slate'` reproduces the source byte-for-byte.
 *
 * A style opts an ACCENT ramp into the same rewrite by writing it as `slate`
 * (`shadcn` does). Styles holding literal palettes (`luna`, `lunaris`) no-op.
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
 * Walk a component's import graph from `components/<Name>.vue`:
 *  - bare specifiers → npm `dependencies`,
 *  - other top-level components → a `registryDependencies` edge (not inlined),
 *  - co-located `components/*` helpers and non-shared `theme/<name>` → INLINED,
 *  - composables/utils/types/plugin/shared-theme → no edge, they ship via `init`.
 * The visited set guards cycles (Island ↔ islandContext, DropdownMenu ↔ items).
 */
function walkComponent(
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
      // Skip back-references to the component we're generating
      // (e.g. internal/DropdownMenuItems.vue → ../DropdownMenu.vue).
      if (depName !== kebab(rootName)) regDeps.add(depName)
      continue
    }
    const seg0 = resolved.split('/')[0]
    const seg1 = resolveSourceFile(resolved).split('/')[1]
    if (seg0 === 'components') {
      const fileRel = resolveSourceFile(resolved)
      if (!files.has(fileRel)) {
        files.set(fileRel, {
          path: fileRel,
          target: fileRel.slice('components/'.length),
          type: 'registry:component',
          content: placeholderizeImports(fileRel, read(fileRel)),
        })
      }
      walkComponent(read, rootName, fileRel, deps, regDeps, files, visited)
    }
    else if (seg0 === 'theme' && seg1 && !SHARED_THEME.has(seg1.replace(/\.\w+$/, ''))) {
      const themeRel = resolveSourceFile(resolved)
      if (!files.has(themeRel)) {
        files.set(themeRel, {
          path: themeRel,
          target: themeRel,
          type: 'registry:theme',
          content: placeholderizeImports(themeRel, read(themeRel)),
        })
      }
      walkComponent(read, rootName, themeRel, deps, regDeps, files, visited)
    }
    // composables/* utils/* types plugin theme/{colors,icons,…} → init payload (no edge)
  }
}

function generateStyle(style: StyleDef) {
  const read = makeReader(style)
  const outDir = join(outRoot, style.name)
  mkdirSync(outDir, { recursive: true })

  const catalog: Array<{ name: string, type: string, dependencies: string[], registryDependencies: string[] }> = []
  const names = componentNames()

  for (const name of names) {
    const deps = new Set<string>()
    const regDeps = new Set<string>()
    const rootRel = `components/${name}.vue`
    const inlined = new Map<string, FileEntry>() // keyed by kit-relative path
    walkComponent(read, name, rootRel, deps, regDeps, inlined, new Set())

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

  // init payload — flat, no recursion.
  const initDeps = new Set<string>()
  const initFiles: FileEntry[] = INIT_SOURCES.map((s) => {
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

// Keeps the `$schema` contracts the manifests reference from drifting from the CLI types.
writeSchemas(resolve(outRoot, '..'))
