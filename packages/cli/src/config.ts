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
