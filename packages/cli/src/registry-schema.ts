/** Registry manifest types, emitted by `tools/gen-registry.ts`. */

export type RegistryFileType = 'registry:ui' | 'registry:theme' | 'registry:lib' | 'registry:style' | 'registry:preset'

export interface RegistryFile {
  /** Source path relative to `packages/kit/src` — used to resolve relative imports. */
  path: string
  /** Category-relative destination (e.g. `Accordion.vue`, `theme/accordion.ts`). */
  target: string
  type: RegistryFileType
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
  registry: string
  components: Array<Pick<RegistryItem, 'name' | 'dependencies' | 'registryDependencies'> & { type: string }>
}
