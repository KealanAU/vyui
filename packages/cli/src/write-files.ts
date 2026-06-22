import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { VyuiConfig } from './config.js'
import type { RegistryFile } from './registry-schema.js'
import { rewriteImports } from './rewrite-imports.js'
import { c, log } from './utils.js'

/** Map a file's category-relative `target` to an on-disk path under the project. */
export function destFor(target: string, config: VyuiConfig, projectRoot: string): string {
  const [seg0, ...rest] = target.split('/')
  const tail = rest.join('/')
  switch (seg0) {
    case 'composables': return join(projectRoot, config.paths.composables, tail)
    case 'utils': return join(projectRoot, config.paths.utils, tail)
    case 'theme': return join(projectRoot, config.paths.theme, tail)
    default:
      if (target.endsWith('.vue')) return join(projectRoot, config.paths.components, target)
      return join(projectRoot, config.paths.lib, target) // types.ts, plugin.ts, style.css, vyui-preset.js
  }
}

/** Preset + raw style files keep relative imports / have none — never rewrite. */
const VERBATIM = new Set(['registry:preset', 'registry:style'])

export interface WriteResult { written: string[], skipped: string[] }

export function writeFiles(files: RegistryFile[], config: VyuiConfig, projectRoot: string, overwrite: boolean): WriteResult {
  const result: WriteResult = { written: [], skipped: [] }
  for (const file of files) {
    const dest = destFor(file.target, config, projectRoot)
    if (existsSync(dest) && !overwrite) {
      result.skipped.push(dest)
      log.step(`${c.yellow('skip')} ${rel(projectRoot, dest)} ${c.dim('(exists, use --overwrite)')}`)
      continue
    }
    const content = VERBATIM.has(file.type) ? file.content : rewriteImports(file, config)
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
