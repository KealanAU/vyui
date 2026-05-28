// Local shim for `vue-lynx` types. Upstream `vue-lynx` only re-exports
// `App`, `Component`, `ComponentPublicInstance`, but consumers regularly need
// the rest of `@vue/runtime-core` (Ref, ComputedRef, DefineComponent, etc.).
// Remove once upstream re-exports the full surface.
//
// The empty `export {}` turns this file into a module so the `declare module`
// block below is treated as an augmentation rather than a redeclaration —
// otherwise it would clobber vue-lynx's real exports (createApp, etc.).
export {}

declare module 'vue-lynx' {
  export type * from '@vue/runtime-core'
}
