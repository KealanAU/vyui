/// <reference path="../../_shared/vue-shim.d.ts" />
// Augments Vue's `GlobalComponents` with the Lynx intrinsic elements so the
// demo's SFC templates type-check against Lynx props. Paired with the Volar
// plugin in `tsconfig.json` (`vue-lynx/types/volar-plugin`).
import 'vue-lynx/types'
import type { Console } from '@lynx-js/types'

declare global {
  // Lynx's PrimJS engine exposes a `console` global with the `Console` shape
  // from `@lynx-js/types`, but ships no ambient declaration. The demo's
  // tsconfig uses `lib: ["ESNext"]` (no DOM) so we surface it here.
  const console: Console
}

export {}
