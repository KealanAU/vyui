import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, win32 } from 'node:path'
import { GRAY_SENTINEL, type VyuiConfig } from './config.js'
import type { RegistryFile } from './registry-schema.js'
import { rewriteImports } from './rewrite-imports.js'
import { c, log } from './utils.js'

/**
 * Map a registry file to its on-disk path under the project. Routing is driven
 * by `file.type` (the manifest carries it); the leading `target` segment is
 * only consulted for the `registry:lib` init payload, which mixes categories
 * (`composables/…`, `utils/…`, `theme/…`, plus root `types.ts` / `plugin.ts`).
 *
 *   registry:ui / registry:component → <components>/<target>  (preserves
 *     subpaths like `internal/DropdownMenuItems.vue`, `islandContext.ts`)
 *   registry:theme                   → <theme>/<basename-after-theme/>
 *   registry:preset / registry:style → <lib>/<target>  (verbatim, no rewrite)
 *   registry:lib                     → routed by leading segment
 */
export function destFor(file: RegistryFile, config: VyuiConfig, projectRoot: string): string {
  const { target, type } = file
  switch (type) {
    case 'registry:ui':
    case 'registry:component':
      return safeDestination(projectRoot, config.paths.components, target)
    case 'registry:theme':
      return safeDestination(projectRoot, config.paths.theme, stripPrefix(target, 'theme'))
    case 'registry:preset':
    case 'registry:style':
      return safeDestination(projectRoot, config.paths.lib, target)
    case 'registry:lib': {
      const [seg0, ...rest] = target.split('/')
      const tail = rest.join('/')
      switch (seg0) {
        case 'composables': return safeDestination(projectRoot, config.paths.composables, tail)
        case 'utils': return safeDestination(projectRoot, config.paths.utils, tail)
        case 'theme': return safeDestination(projectRoot, config.paths.theme, tail)
        default: return safeDestination(projectRoot, config.paths.lib, target)
      }
    }
  }
}

/**
 * Resolve an untrusted registry target beneath its configured category root.
 * Both the configured root and final file must remain inside the project.
 */
function safeDestination(projectRoot: string, configuredRoot: string, target: string): string {
  if (!target || target.includes('\0') || isAbsolute(target) || win32.isAbsolute(target)) {
    throw new Error(`Unsafe registry target: ${JSON.stringify(target)}`)
  }

  const project = resolve(projectRoot)
  const base = resolve(project, configuredRoot)
  assertWithin(project, base, `Configured path "${configuredRoot}" escapes the project root`)

  const destination = resolve(base, target)
  if (destination === base) {
    throw new Error(`Registry target "${target}" does not name a file`)
  }
  assertWithin(base, destination, `Registry target "${target}" escapes its destination directory`)
  return destination
}

function assertWithin(parent: string, child: string, message: string): void {
  const rel = relative(parent, child)
  if (rel === '..' || rel.startsWith(`..${win32.sep}`) || rel.startsWith('../') || isAbsolute(rel)) {
    throw new Error(message)
  }
}

/** Drop a leading `<prefix>/` segment if present (e.g. `theme/button.ts` → `button.ts`). */
function stripPrefix(target: string, prefix: string): string {
  return target.startsWith(`${prefix}/`) ? target.slice(prefix.length + 1) : target
}

/** Preset + raw style files keep relative imports / have none — never rewrite. */
const VERBATIM = new Set(['registry:preset', 'registry:style'])

export interface WriteResult { written: string[], skipped: string[], planned: string[] }

export function writeFiles(
  files: RegistryFile[],
  config: VyuiConfig,
  projectRoot: string,
  overwrite: boolean,
  dryRun = false,
  logSkipped = true,
): WriteResult {
  const result: WriteResult = { written: [], skipped: [], planned: [] }
  for (const file of files) {
    const dest = destFor(file, config, projectRoot)
    if (existsSync(dest) && !overwrite) {
      result.skipped.push(dest)
      if (logSkipped) log.step(`${c.yellow('skip')} ${rel(projectRoot, dest)} ${c.dim('(exists, use --overwrite)')}`)
      continue
    }
    // `rewriteImports` swaps the `@@vyui:` import placeholders for the user's
    // aliases (skipped for VERBATIM preset/style files). The gray substitution
    // is orthogonal — it swaps the `__VYUI_GRAY__` neutral-palette sentinel for
    // the configured `baseColor` — so it runs on EVERY file regardless of
    // VERBATIM (the sentinel lives in `style.css`, a VERBATIM file, AND in
    // `plugin.ts`, which goes through rewriteImports).
    const rewritten = VERBATIM.has(file.type) ? file.content : rewriteImports(file, config)
    const content = rewritten.replaceAll(GRAY_SENTINEL, config.baseColor)
    if (dryRun) {
      result.planned.push(dest)
      log.step(`${c.cyan('plan')} ${rel(projectRoot, dest)}`)
      continue
    }
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, content)
    result.written.push(dest)
    log.step(`${c.green('add ')} ${rel(projectRoot, dest)}`)
  }
  return result
}

function rel(root: string, p: string): string {
  return relative(root, p)
}
