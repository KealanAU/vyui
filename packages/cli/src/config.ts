import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const CONFIG_FILE = 'vyui.config.json'

export interface VyuiConfig {
  $schema?: string
  /** Base registry URL, e.g. `https://vyui.dev/r`. */
  registry: string
  /** Selected style (registry namespace), e.g. `default`. */
  style: string
  /** Default semantic gray palette. */
  baseColor: string
  /** Import-specifier aliases used when rewriting copied source. */
  aliases: {
    components: string
    lib: string
    theme: string
    composables: string
    utils: string
  }
  /** On-disk directories (relative to project root) the aliases resolve to. */
  paths: {
    components: string
    lib: string
    theme: string
    composables: string
    utils: string
  }
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
export function styleRegistry(config: Pick<VyuiConfig, 'registry' | 'style'>): string {
  return `${config.registry}/${config.style}`
}

export function readConfig(cwd: string): VyuiConfig | undefined {
  const p = configPath(cwd)
  if (!existsSync(p)) return undefined
  return JSON.parse(readFileSync(p, 'utf8')) as VyuiConfig
}

export function writeConfig(cwd: string, config: VyuiConfig): void {
  writeFileSync(configPath(cwd), `${JSON.stringify(config, null, 2)}\n`)
}

/**
 * Build a default config from a source dir + import prefix. Components live
 * under `<prefix>/components/vyui`, support files under `<prefix>/lib/vyui`.
 */
export function defaultConfig(registry: string, style: string, srcDir: string, prefix: string, baseColor: string): VyuiConfig {
  const a = (sub: string) => `${prefix}/${sub}`
  const p = (sub: string) => join(srcDir, sub)
  return {
    $schema: 'https://vyui.dev/schema.json',
    registry,
    style,
    baseColor,
    aliases: {
      components: a('components/vyui'),
      lib: a('lib/vyui'),
      theme: a('lib/vyui/theme'),
      composables: a('lib/vyui/composables'),
      utils: a('lib/vyui/utils'),
    },
    paths: {
      components: p('components/vyui'),
      lib: p('lib/vyui'),
      theme: p('lib/vyui/theme'),
      composables: p('lib/vyui/composables'),
      utils: p('lib/vyui/utils'),
    },
    tailwind: {
      config: 'tailwind.config.js',
      css: join(srcDir, 'style.css'),
    },
  }
}
