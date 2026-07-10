import { installIntlPolyfill, registerIconSet } from '@vyui/core'

// Derived from `registerIconSet`'s own param rather than importing
// `@iconify/types` directly — that package isn't a direct dependency of
// `apps/examples/*` (only of `packages/core`), and pnpm's strict
// node_modules would fail to resolve it from here.
type IconSetData = Parameters<typeof registerIconSet>[1]

/**
 * Shared demo bootstrap, run before `createApp`/`app.mount()`:
 *   1. Installs the Intl polyfill Lynx's PrimJS engine lacks (no-op on web).
 *   2. Registers each demo's icon sets with core's renderer (Lynx-native
 *      `<svg content="...">`), keyed by iconify prefix (e.g. `lucide`,
 *      `icon-park-outline`).
 */
export function installVyui(iconSets: Record<string, IconSetData>): void {
  installIntlPolyfill()
  for (const [prefix, data] of Object.entries(iconSets)) {
    registerIconSet(prefix, data)
  }
}
