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

> [!IMPORTANT]
> **Dark mode requires two Lynx engine flags in the consuming app's
> `lynx.config.ts`** (see [Required engine flags](#required-engine-flags)).
> They are page-level build config, so the kit can't set them for you — same
> as the Tailwind preset / `style.css` import. With them on, live toggling
> works on both web and Lynx native.

### Required engine flags

```ts
// lynx.config.ts
import { pluginVueLynx } from 'vue-lynx/plugin'

export default defineConfig({
  plugins: [
    pluginVueLynx({
      enableCSSInheritance: true,    // descendants read ancestor CSS vars
      enableCSSInlineVariables: true, // `--*` in :style parse + re-propagate on change
    }),
  ],
})
```

Both default **off** in Lynx. Why both are needed (the symptom if you forget):
with them off, a runtime change to an ancestor's `--ui-*` value only reaches
descendants for natively-**inheritable** properties (`color` updates), while
non-inheritable ones (**`background-color`**, `border-color`) stay on their
first-render value — so surfaces won't flip. `enableCSSInlineVariables` makes
inline `--*` parse as custom properties and re-propagate to descendants on
change; `enableCSSInheritance` lets descendants resolve ancestor vars at all.
This is vue-lynx's documented "Approach A" for theming (see its
`website/docs/guide/tailwindcss.mdx`).

> [!NOTE]
> These are per-Lynx-page flags. If you run multiple frameworks on one page
> (e.g. Sparkling), confirm enabling them is acceptable in that host — TBD.

Light/default mode does **not** need the flags (it renders from `:root` at
mount); only runtime theme switching does.

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

### Why value-flip (not key add/remove)

`style.value` always carries the **full** token set (`LIGHT_VARS` / `DARK_VARS`,
same keys, different values). Toggling changes values only — it never adds or
removes keys. On Lynx native, var **value** updates re-propagate cleanly; adding
or removing inline keys is less reliable, so keeping every key present and just
flipping the value is the robust path (and mirrors how `--ui-radius` updates).

The `.dark` class in the example is for the web target / parity; on native the
inline `:style` map does the work.
