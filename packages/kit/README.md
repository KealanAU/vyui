# @vyui/kit

Pre-alpha. Styled Vue-Lynx components built on `@vyui/core`.

Expect breaking changes on every release until 0.1.0.

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

## Dark mode

> [!WARNING]
> **Live dark-mode toggling works on the web target but NOT on Lynx native
> today.** Components, `useColorMode`, and `VyColorModeSwitch` are shipped, but
> on native a running app will not flip when the mode changes. See the
> limitation below before relying on it.

### How it's designed

Mirrors nuxt/ui: components reference **semantic surface/text/border tokens**
(`bg-default`, `bg-muted`, `bg-elevated`, `bg-inverted`, `text-default`,
`text-muted`, `text-dimmed`, `text-highlighted`, `text-inverted`,
`border-default`, `border-accented`, …) instead of raw neutral shades. Each
token is a CSS variable defined light in `:root` and dark in `.dark`
(`src/style.css`), registered on the preset's per-property scales
(`textColor` / `backgroundColor` / `borderColor`) so the same token name maps to
the right var per prefix. **No Tailwind `dark:` variant** — only the var values
change.

`useColorMode()` holds the mode (a singleton — Lynx has no global `<html>` to
flag) and exposes `LIGHT_VARS` / `DARK_VARS` plus a `style` object to bind on the
**root `<view>`** via `:style`. `VyColorModeSwitch` wraps `VySwitch` and flips
it (sun/dark icons from `appConfig.ui.icons.light` / `.dark`).

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useColorMode, VyColorModeSwitch } from '@vyui/kit'
const { isDark, style } = useColorMode()
const rootStyle = computed(() => ({ '--ui-radius': '0.25rem', ...style.value }))
</script>

<template>
  <view :class="[isDark ? 'dark' : '', 'bg-default']" :style="rootStyle">
    <VyColorModeSwitch />
    …
  </view>
</template>
```

### The Lynx-native limitation

`enableCSSInheritance` is kept **off** (it's a per-page flag the kit can't assume
across multi-framework hosts — see Sparkling). With it off, the Lynx native
engine does **not** re-propagate a CSS custom-property change from an ancestor to
its already-mounted descendants at runtime. Empirically:

- **Stylesheet class swap** (`.dark { … }`): no descendant re-resolution → no flip.
- **Inline `:style` var swap** on the root: `color` and `border-color` on
  descendants DO update live, but **`background-color` does not** — surfaces stay
  on their initial value.
- **Adding/removing** style keys doesn't re-propagate either (so a value-only
  flip of an always-present key is required, but still doesn't cover `background`).
- **Remounting** the subtree on toggle didn't recover `background-color` on native.

On the **web** target CSS vars cascade and update normally, so the whole thing
works there.

Related upstream: vue-lynx#144 / lynx-family/lynx#5912 address `v-bind()` /
inline-var propagation, but not stylesheet-class var propagation with inheritance
off — so they aren't expected to fix this on their own.

### Status / options

- **Web:** fully works (live toggle).
- **Lynx native:** not working for live toggle. The realistic options are (a)
  pick the mode at app startup before first render (static — initial mount
  resolves `:root`/element vars correctly), or (b) revisit live toggle if
  `enableCSSInheritance` is reconsidered or the engine gains runtime
  custom-property propagation for `background-color`.

The token migration itself is still worthwhile regardless: light/default mode
renders from `:root` and is unaffected, and it keeps the theme aligned with
nuxt/ui.
