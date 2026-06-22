import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { VyuiConfig } from './config.js'
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
      return join(projectRoot, config.paths.components, target)
    case 'registry:theme':
      return join(projectRoot, config.paths.theme, stripPrefix(target, 'theme'))
    case 'registry:preset':
    case 'registry:style':
      return join(projectRoot, config.paths.lib, target)
    case 'registry:lib': {
      const [seg0, ...rest] = target.split('/')
      const tail = rest.join('/')
      switch (seg0) {
        case 'composables': return join(projectRoot, config.paths.composables, tail)
        case 'utils': return join(projectRoot, config.paths.utils, tail)
        case 'theme': return join(projectRoot, config.paths.theme, tail)
        default: return join(projectRoot, config.paths.lib, target) // types.ts, plugin.ts
      }
    }
  }
}

/** Drop a leading `<prefix>/` segment if present (e.g. `theme/button.ts` → `button.ts`). */
function stripPrefix(target: string, prefix: string): string {
  return target.startsWith(`${prefix}/`) ? target.slice(prefix.length + 1) : target
}

/** Preset + raw style files keep relative imports / have none — never rewrite. */
const VERBATIM = new Set(['registry:preset', 'registry:style'])

export interface WriteResult { written: string[], skipped: string[] }

export function writeFiles(files: RegistryFile[], config: VyuiConfig, projectRoot: string, overwrite: boolean): WriteResult {
  const result: WriteResult = { written: [], skipped: [] }
  for (const file of files) {
    const dest = destFor(file, config, projectRoot)
    if (existsSync(dest) && !overwrite) {
      result.skipped.push(dest)
      log.step(`${c.yellow('skip')} ${rel(projectRoot, dest)} ${c.dim('(exists, use --overwrite)')}`)
      continue
    }
    // `rewriteImports` swaps the `@@vyui:` import placeholders for the user's
    // aliases (skipped for VERBATIM preset/style files). The gray substitution
    // is orthogonal — it swaps the `__VYUI_GRAY__` neutral-palette sentinel for
    // the configured `baseColor` — so it runs on EVERY file regardless of
    // VERBATIM (the sentinel lives in `style.css`, a VERBATIM file, AND in
    // `plugin.ts`, which goes through rewriteImports).
    const rewritten = VERBATIM.has(file.type) ? file.content : rewriteImports(file, config)
    const content = rewritten.replaceAll('__VYUI_GRAY__', config.baseColor)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, content)
    result.written.push(dest)
    log.step(`${c.green('add ')} ${rel(projectRoot, dest)}`)
  }
  return result
}

function rel(root: string, p: string): string {
  return p.startsWith(root) ? p.slice(root.length).replace(/^[/\\]/, '') : p
}
