import { posix } from 'node:path'
import type { VyuiConfig } from './config.js'
import type { RegistryFile } from './registry-schema.js'

const SPEC_RE = /(from\s+['"])([^'"]+)(['"])/g

/**
 * Rewrite a copied kit file's relative imports to the consumer's aliases.
 *
 * Resolution uses `file.path` (the source path relative to `packages/kit/src`)
 * to turn each relative specifier back into a kit-relative module path, then
 * maps it to an alias by its top-level segment:
 *   components/Foo.vue → aliases.components/Foo.vue
 *   theme/foo          → aliases.theme/foo
 *   composables/foo    → aliases.composables/foo
 *   utils/foo          → aliases.utils/foo
 *   types | plugin     → aliases.lib/<name>
 * Bare specifiers (vue, @vyui/core, tailwind-variants, …) are left untouched.
 */
export function rewriteImports(file: RegistryFile, config: VyuiConfig): string {
  const dir = posix.dirname(file.path)
  return file.content.replace(SPEC_RE, (match, pre: string, spec: string, post: string) => {
    if (!spec.startsWith('.')) return match
    const resolved = posix.normalize(posix.join(dir, spec))
    const [seg0, ...rest] = resolved.split('/')
    const tail = rest.join('/')
    let alias: string
    switch (seg0) {
      case 'components': alias = `${config.aliases.components}/${tail}`; break
      case 'theme': alias = `${config.aliases.theme}/${tail}`; break
      case 'composables': alias = `${config.aliases.composables}/${tail}`; break
      case 'utils': alias = `${config.aliases.utils}/${tail}`; break
      default: alias = `${config.aliases.lib}/${resolved}` // root-level: types, plugin
    }
    return `${pre}${alias}${post}`
  })
}
