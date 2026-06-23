/** Registry manifest types, emitted by `tools/gen-registry.ts`. */

export type RegistryFileType =
  | 'registry:ui'
  /** Co-located component helper (e.g. `internal/*.vue`, `*Context.ts`) inlined into a UI manifest. */
  | 'registry:component'
  | 'registry:theme'
  | 'registry:lib'
  | 'registry:style'
  | 'registry:preset'

export interface RegistryFile {
  /** Source path relative to `packages/kit/src` (informational; not used for routing). */
  path: string
  /** Category-relative destination (e.g. `Accordion.vue`, `internal/Items.vue`, `theme/accordion.ts`). */
  target: string
  type: RegistryFileType
  /**
   * File source. Relative imports are emitted as `@@vyui:<category>/<rest>`
   * placeholders (substituted to the consumer's aliases on write); preset/style
   * files keep their relative imports verbatim.
   */
  content: string
}

export interface RegistryItem {
  name: string
  type: 'registry:ui' | 'registry:lib'
  /** npm packages as `name@range` specifiers. */
  dependencies: string[]
  /** Other registry item names this one composes. */
  registryDependencies: string[]
  files: RegistryFile[]
}

export interface RegistryIndex {
  $schema?: string
  registry: string
  /** Style namespace this index belongs to (e.g. `default`). */
  style?: string
  components: Array<Pick<RegistryItem, 'name' | 'dependencies' | 'registryDependencies'> & { type: string }>
}

/** Root `styles.json` catalog of available styles. */
export interface RegistryStyles {
  $schema?: string
  registry: string
  /** Default style name. */
  default: string
  /** All registered style names. */
  styles: string[]
}
