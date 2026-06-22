import type { VyuiConfig } from './config.js'
import type { RegistryFile } from './registry-schema.js'

/**
 * The generator (`tools/gen-registry.ts`) emits every RELATIVE import as a
 * stable `@@vyui:<category>/<rest>` placeholder, computed from an AST parse of
 * the source (so comments/strings are never rewritten). The CLI's only job is a
 * literal substitution of each placeholder prefix to the consumer's alias —
 * no source parsing, no `file.path` math, no comment hazards.
 */
const CATEGORY_PREFIXES = ['components', 'theme', 'composables', 'utils', 'lib'] as const

/**
 * Rewrite a copied kit file's `@@vyui:` import placeholders to the consumer's
 * aliases. Bare specifiers (vue, @vyui/core, tailwind-variants, …) carry no
 * placeholder and are left untouched. Preset/style files have no placeholders
 * (their relative imports are emitted verbatim) so this is a no-op for them.
 */
export function rewriteImports(file: RegistryFile, config: VyuiConfig): string {
  let out = file.content
  for (const category of CATEGORY_PREFIXES) {
    out = out.replaceAll(`@@vyui:${category}/`, `${config.aliases[category]}/`)
  }
  return out
}
