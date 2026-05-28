// Ambient type setup for vyui core.
//
// Importing `vue-lynx/types` augments Vue's `GlobalComponents` interface with
// the Lynx intrinsic elements (`<view>`, `<text>`, `<scroll-view>`, `<overlay>`,
// …) so SFC templates type-check against Lynx element props rather than HTML.
// Pair this with the Volar plugin in `tsconfig.json` (`vue-lynx/types/volar-plugin`).
import 'vue-lynx/types'

declare global {
  /** Injected by vue-lynx's build plugin; `false` in production bundles. */
  const __DEV__: boolean

  // Subset of vite/client's ImportMetaEnv augmentation. Inlined because
  // `vite` is a workspace-root dep, not a direct dep of vyui/core.
  interface ImportMeta {
    readonly env: {
      readonly MODE: string
      readonly DEV: boolean
      readonly PROD: boolean
      readonly SSR: boolean
      readonly [key: string]: string | boolean | undefined
    }
  }
}

export {}
