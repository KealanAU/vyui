import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { detectTsconfigAlias } from './config.js'
import { isRecord } from './utils.js'

export interface ProjectInfo {
  cwd: string
  packageJson?: string
  appEntry?: string
  tailwindConfig?: string
  css?: string
  sourceDir: string
  alias?: { prefix: string, srcDir: string }
  isVueLynx: boolean
}

const APP_ENTRIES = ['src/index.ts', 'src/main.ts', 'src/index.js', 'src/main.js']
const TAILWIND_CONFIGS = ['tailwind.config.ts', 'tailwind.config.js', 'tailwind.config.mjs', 'tailwind.config.cjs']
const CSS_ENTRIES = ['src/index.css', 'src/style.css', 'src/main.css', 'src/app.css']

export function detectProject(cwd: string): ProjectInfo {
  const alias = detectTsconfigAlias(cwd)
  const packageJson = existsSync(join(cwd, 'package.json')) ? 'package.json' : undefined
  const pkg = packageJson ? readJson(join(cwd, packageJson)) : undefined
  const deps = {
    ...(isRecord(pkg?.dependencies) ? pkg.dependencies : {}),
    ...(isRecord(pkg?.devDependencies) ? pkg.devDependencies : {}),
  }
  const appEntry = firstExisting(cwd, APP_ENTRIES) ?? findSourceFile(cwd, /\bcreateApp\s*\(/)
  const tailwindConfig = firstExisting(cwd, TAILWIND_CONFIGS)
  const css = detectCss(cwd, appEntry)
  return {
    cwd,
    packageJson,
    appEntry,
    tailwindConfig,
    css,
    sourceDir: alias?.srcDir ?? (existsSync(join(cwd, 'src')) ? 'src' : '.'),
    alias,
    isVueLynx: 'vue-lynx' in deps || Boolean(appEntry && readFileSync(join(cwd, appEntry), 'utf8').includes('vue-lynx')),
  }
}

function detectCss(cwd: string, appEntry?: string): string | undefined {
  if (appEntry) {
    const source = readFileSync(join(cwd, appEntry), 'utf8')
    for (const match of source.matchAll(/import\s+['"](.+?\.css)['"]/g)) {
      const candidate = join(appEntry, '..', match[1])
      const normalized = relative(cwd, join(cwd, candidate))
      if (existsSync(join(cwd, normalized))) return normalized
    }
  }
  return firstExisting(cwd, CSS_ENTRIES)
}

function firstExisting(cwd: string, candidates: string[]): string | undefined {
  return candidates.find(candidate => existsSync(join(cwd, candidate)))
}

function findSourceFile(cwd: string, pattern: RegExp): string | undefined {
  const src = join(cwd, 'src')
  if (!existsSync(src)) return undefined
  for (const name of readdirSync(src)) {
    if (!/\.[cm]?[jt]s$/.test(name)) continue
    const path = join(src, name)
    if (pattern.test(readFileSync(path, 'utf8'))) return relative(cwd, path)
  }
  return undefined
}

function readJson(path: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'))
    return isRecord(value) ? value : undefined
  }
  catch {
    return undefined
  }
}
