import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import { isRecord } from './utils.js'

export const CONFIG_FILE = 'vyui.config.json'

/** Default registry base URL when none is configured or passed via `--registry`. */
export const DEFAULT_REGISTRY = 'https://vyui.dev/r'

/** Default style namespace when none is configured or passed via `--style`. */
export const DEFAULT_STYLE = 'default'

/** Neutral/gray palettes the `__VYUI_GRAY__` sentinel can be substituted for. */
export const BASE_COLORS: readonly string[] = ['slate', 'gray', 'zinc', 'neutral', 'stone']

/** Default neutral palette when none is configured or passed via `--base-color`. */
export const DEFAULT_BASE_COLOR = 'slate'

/**
 * The alias/path categories shared across the CLI: config (`aliases`/`paths`),
 * import rewriting (`@@vyui:<category>/` placeholders), and file routing. This
 * is the single source of truth — adding a category here flows to every loop
 * that iterates them. (Routing switches in `write-files`/`gen-registry` still
 * need a per-category branch since their handling differs.)
 */
export const ALIAS_CATEGORIES = ['components', 'lib', 'theme', 'composables', 'utils'] as const
export type AliasCategory = typeof ALIAS_CATEGORIES[number]

/** Subpath (relative to the source dir) each category lives under. */
const CATEGORY_SUBPATHS: Record<AliasCategory, string> = {
  components: 'components/vyui',
  lib: 'lib/vyui',
  theme: 'lib/vyui/theme',
  composables: 'lib/vyui/composables',
  utils: 'lib/vyui/utils',
}

export interface VyuiConfig {
  $schema?: string
  /** Base registry URL, e.g. `https://vyui.dev/r`. */
  registry: string
  /** Selected style (registry namespace), e.g. `default`. */
  style: string
  /** Default semantic gray palette. */
  baseColor: string
  /** Import-specifier aliases used when rewriting copied source. */
  aliases: Record<AliasCategory, string>
  /** On-disk directories (relative to project root) the aliases resolve to. */
  paths: Record<AliasCategory, string>
  tailwind: {
    config: string
    css: string
  }
}

export function configPath(cwd: string): string {
  return join(cwd, CONFIG_FILE)
}

/**
 * Parse JSON that may contain `//` / block comments and trailing commas
 * (tsconfig/jsconfig allow these). Returns `undefined` if it still won't parse.
 */
function parseJsonc<T>(text: string): T | undefined {
  // Strip block and line comments (but not inside strings).
  let out = ''
  let inStr = false
  let quote = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inStr) {
      out += ch
      if (ch === '\\') {
        out += next ?? ''
        i++
      }
      else if (ch === quote) {
        inStr = false
      }
      continue
    }
    if (ch === '"' || ch === '\'') {
      inStr = true
      quote = ch
      out += ch
      continue
    }
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i++
      out += '\n'
      continue
    }
    if (ch === '/' && next === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i++
      continue
    }
    out += ch
  }
  // Strip trailing commas before } or ].
  out = out.replace(/,(\s*[}\]])/g, '$1')
  try {
    return JSON.parse(out) as T
  }
  catch {
    return undefined
  }
}

export interface DetectedAlias {
  /** Import prefix, e.g. `@` for a `"@/*"` paths entry. */
  prefix: string
  /** Source directory the prefix resolves to, e.g. `src` for `["./src/*"]`. */
  srcDir: string
}

/**
 * Read `tsconfig.json` (then `jsconfig.json`) from `cwd` and derive the import
 * alias prefix + target src dir from the first wildcard `compilerOptions.paths`
 * entry. e.g. `"@/*": ["./src/*"]` → `{ prefix: '@', srcDir: 'src' }`.
 * Returns `undefined` when no such config / wildcard entry exists.
 */
export function detectTsconfigAlias(cwd: string): DetectedAlias | undefined {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(cwd, file)
    if (!existsSync(p)) continue
    const parsed = parseJsonc<{ compilerOptions?: { paths?: Record<string, string[]> } }>(readFileSync(p, 'utf8'))
    const paths = parsed?.compilerOptions?.paths
    if (!paths) continue
    for (const [key, targets] of Object.entries(paths)) {
      // Only wildcard entries map a prefix → a directory (e.g. `@/*`).
      if (!key.endsWith('/*')) continue
      const target = targets?.[0]
      if (!target) continue
      const prefix = key.slice(0, -2) // drop trailing `/*`
      // `./src/*` → `src`; `./app/*` → `app`; `./*` → `.`
      const srcDir = target.replace(/\/\*$/, '').replace(/^\.\//, '') || '.'
      return { prefix, srcDir }
    }
  }
  return undefined
}

/** True if `tsconfig.json`/`jsconfig.json` declares a `paths` entry for `<prefix>/*`. */
export function hasPathsEntryForPrefix(cwd: string, prefix: string): boolean {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    const p = join(cwd, file)
    if (!existsSync(p)) continue
    const parsed = parseJsonc<{ compilerOptions?: { paths?: Record<string, string[]> } }>(readFileSync(p, 'utf8'))
    const paths = parsed?.compilerOptions?.paths
    if (!paths) continue
    if (Object.keys(paths).some(k => k === `${prefix}/*` || k === prefix)) return true
  }
  return false
}

/** Style-qualified registry base, e.g. `https://vyui.dev/r/default`. */
export function resolveRegistryBase(registry: string, cwd: string): string {
  if (/^https?:\/\//.test(registry) || registry.startsWith('file:') || isAbsolute(registry)) return registry.replace(/\/$/, '')
  return resolve(cwd, registry)
}

/** Style-qualified registry built from an already-resolved config. */
export function styleRegistry(config: Pick<VyuiConfig, 'registry' | 'style'>, cwd = process.cwd()): string {
  return `${resolveRegistryBase(config.registry, cwd)}/${config.style}`
}

export interface ResolvedRegistry {
  /** Registry root (where `styles.json` lives), e.g. `https://vyui.dev/r`. */
  base: string
  /** Selected style namespace, e.g. `default`. */
  style: string
  /** Style-qualified registry, `${base}/${style}`. */
  styled: string
}

/**
 * Resolve the effective registry from flags + config + defaults, applying one
 * precedence rule everywhere it's needed: explicit `--registry`/`--style` flags
 * win, then an existing config, then the built-in defaults. `base` feeds
 * style-listing (`styles`, `init`); `styled` feeds item fetches (`list`, `view`,
 * `add`). Pass `config` when it's already loaded to avoid re-reading it.
 */
export function resolveRegistry(
  cwd: string,
  flags: { registry?: string, style?: string } = {},
  config = readConfig(cwd),
): ResolvedRegistry {
  const base = resolveRegistryBase(flags.registry ?? config?.registry ?? DEFAULT_REGISTRY, cwd)
  const style = flags.style ?? config?.style ?? DEFAULT_STYLE
  return { base, style, styled: `${base}/${style}` }
}

export function readConfig(cwd: string): VyuiConfig | undefined {
  const p = configPath(cwd)
  if (!existsSync(p)) return undefined
  let value: unknown
  try {
    value = JSON.parse(readFileSync(p, 'utf8'))
  }
  catch {
    throw new Error(`Invalid ${CONFIG_FILE}: expected valid JSON`)
  }
  if (!isVyuiConfig(value)) {
    throw new Error(`Invalid ${CONFIG_FILE}: missing required registry, style, baseColor, aliases, paths, or tailwind fields`)
  }
  return value
}

export function writeConfig(cwd: string, config: VyuiConfig): void {
  writeFileSync(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`)
}

/** Map each category's subpath through `fn` into a category-keyed record. */
function mapCategories(fn: (subpath: string) => string): Record<AliasCategory, string> {
  return Object.fromEntries(
    ALIAS_CATEGORIES.map(category => [category, fn(CATEGORY_SUBPATHS[category])]),
  ) as Record<AliasCategory, string>
}

/**
 * Build a default config from a source dir + import prefix. Components live
 * under `<prefix>/components/vyui`, support files under `<prefix>/lib/vyui`.
 */
export function defaultConfig(
  registry: string,
  style: string,
  srcDir: string,
  prefix: string,
  baseColor: string,
  detected?: { tailwindConfig?: string, css?: string },
): VyuiConfig {
  return {
    $schema: 'https://vyui.dev/schema.json',
    registry,
    style,
    baseColor,
    aliases: mapCategories(subpath => `${prefix}/${subpath}`),
    paths: mapCategories(subpath => join(srcDir, subpath)),
    tailwind: {
      config: detected?.tailwindConfig ?? 'tailwind.config.js',
      css: detected?.css ?? join(srcDir, 'style.css'),
    },
  }
}

function hasStringKeys(value: unknown, keys: readonly string[]): value is Record<string, string> {
  return isRecord(value) && keys.every(key => typeof value[key] === 'string' && value[key].length > 0)
}

function isVyuiConfig(value: unknown): value is VyuiConfig {
  if (!isRecord(value)) return false
  return typeof value.registry === 'string'
    && typeof value.style === 'string'
    && typeof value.baseColor === 'string'
    && hasStringKeys(value.aliases, ALIAS_CATEGORIES)
    && hasStringKeys(value.paths, ALIAS_CATEGORIES)
    && hasStringKeys(value.tailwind, ['config', 'css'])
}
