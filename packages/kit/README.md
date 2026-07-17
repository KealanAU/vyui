# @vyui/kit

Styled `Vy*` components for [Vue-Lynx](https://vue.lynxjs.org), built on the
headless [`@vyui/core`](https://www.npmjs.com/package/@vyui/core) primitives —
the ready-to-use layer of [Vy UI](https://vyui.dev). Ship native apps for iOS,
Android, and web from one Vue codebase.

> ⚠️ **Alpha.** Expect breaking changes on every release until 1.0.0.

`@vyui/kit` depends on `@vyui/core` but does **not** re-export the full core
surface: import styled `Vy*` components from kit, and raw primitives from core.

## Install

```sh
npm install @vyui/core @vyui/kit
# or: pnpm add @vyui/core @vyui/kit
```

Kit ships its styling as a Tailwind preset and a theme stylesheet that need
wiring alongside the Lynx preset. Follow the
**[installation guide](https://vyui.dev/getting-started/installation)** for the
full setup, or use the [`@vyui/cli`](https://www.npmjs.com/package/@vyui/cli) to
scaffold it — `npx @vyui/cli init`.

## Usage

```vue
<script setup>
import { VyButton } from '@vyui/kit'
</script>

<template>
  <VyButton color="primary">Click me</VyButton>
</template>
```

Full docs, API tables, and live examples: **[vyui.dev](https://vyui.dev)**.

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
