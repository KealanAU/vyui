---
"@vyui/kit": minor
---

Configurable semantic colors (nuxt/ui-style), defined once and extensible.

- Single source of truth `theme/color-constants.js` (shared by themes + Tailwind preset); `neutral` split out of the configurable `COLORS` list and appended automatically (nuxt/ui parity).
- Theme files are now builder functions `(colors) => themeObject`; `useStyledComponent` invokes them with the resolved list so `appConfig.ui.colors` configures the set at runtime.
- `@vyui/kit/tailwind` adds a `createVyuiPreset({ colors })` factory; the default export is unchanged.
- True type parity via the augmentable `VyuiColorRegistry` interface — `declare module '@vyui/kit' { interface VyuiColorRegistry { tertiary: true } }` makes custom colors autocomplete + typo-check on every component `color` prop, no build plugin needed. `scripts/gen-colors.mjs` generates the registry augmentation + CSS-var block.
- Fixes a latent `ThemeTV` widening that typed `color` (and other variants) as `PropertyKey` on `useStyledComponent`-based components.

Breaking: theme default exports changed from objects to builder functions; `COLORS` no longer includes `neutral` (use `ALL_COLORS`).
