# @vyui/kit

Alpha. Styled Vue-Lynx components built on `@vyui/core`.

Expect breaking changes on every release until 1.0.0.

## Colors

Components expose a `color` prop over a configurable semantic set. The default
set mirrors nuxt/ui:

- Configurable: `primary`, `secondary`, `success`, `info`, `warning`, `error`
- Always appended: `neutral` (kept out of the configurable list, nuxt/ui parity)

The list is defined once in `src/theme/color-constants.js` (the single source of
truth shared by the runtime themes and the Tailwind preset). Theme files are
**builder functions** `(colors) => themeObject` that emit their `color` variants
from the resolved list, so changing the set updates every component.

### Configuring colors at runtime

```ts
app.use(VyUI, { ui: { colors: ['primary', 'secondary', 'success', 'info', 'warning', 'error'] } })
```

`neutral` is appended automatically. Per-color icon palettes (Lynx SVG icons
bake a hex fill) resolve from `appConfig.ui.<name>` / `appConfig.ui.gray`,
falling back to the defaults in `color-constants.js`.

### Tailwind preset

```ts
import vyuiPreset from '@vyui/kit/tailwind'
export default { presets: [lynxPreset, vyuiPreset] }
```

For a custom set, use the factory (keep it in sync with `ui.colors`):

```ts
import { createVyuiPreset, COLORS } from '@vyui/kit/tailwind'
export default { presets: [lynxPreset, createVyuiPreset({ colors: [...COLORS, 'tertiary'] })] }
```

### Adding a custom color (true parity)

Custom colors track the `color` prop type exactly — added colors autocomplete
and typo-check everywhere — via module augmentation of `VyuiColorRegistry` (the
vue-router `RouteNamedMap` pattern), no build plugin required.

1. **Types** — augment the registry (in an app `.d.ts`):
   ```ts
   declare module '@vyui/kit' {
     interface VyuiColorRegistry { tertiary: true }
   }
   ```
2. **Runtime** — register the name: `app.use(VyUI, { ui: { colors: [...COLORS, 'tertiary'] } })`.
3. **Tailwind** — `createVyuiPreset({ colors: [...COLORS, 'tertiary'] })` (adds the scale + safelist).
4. **CSS** — add a `--ui-color-tertiary-{50..950}` block (palette mapping; the
   consumer override contract — see `src/style.css`).
5. **Icons (optional)** — `appConfig.ui.tertiary = '<palette>'` for SVG icon fills.

Steps 1 and 4 can be generated:

```sh
node node_modules/@vyui/kit/scripts/gen-colors.mjs --colors tertiary=indigo --out-dir ./vyui-generated
```

This writes `vyui-colors.d.ts` (the registry augmentation) and `vyui-colors.css`
(the CSS-var block). Include the `.d.ts` in your `tsconfig` and import the `.css`
after `@vyui/kit/style.css`, then do steps 2–3. Without steps 3 + 4 the classes
resolve to nothing (unstyled, no error) — inherent to Tailwind v3 static
generation, same as nuxt/ui's build-config requirement.
