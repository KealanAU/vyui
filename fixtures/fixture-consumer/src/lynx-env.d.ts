// Augments Vue's `GlobalComponents` with the Lynx intrinsic elements (`view`,
// `text`, …) so this fixture's SFC template type-checks against Lynx props.
// Paired with the Volar plugin in `tsconfig.json` (`vue-lynx/types/volar-plugin`).
import 'vue-lynx/types'
import type { Console } from '@lynx-js/types'

declare global {
  // Lynx's PrimJS engine exposes a `console` global with the `Console` shape
  // from `@lynx-js/types`, but ships no ambient declaration. This package's
  // tsconfig uses `lib: ["ESNext"]` (no DOM) so we surface it here.
  const console: Console
}

export {}
