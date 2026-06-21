---
title: Icon
description: Render registered Iconify data or a custom Vue component through Lynx-native SVG.
navigation:
  icon: i-lucide-sparkles
package: core
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Icon/Icon.vue
    target: _blank
  - label: Resolver
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/core/src/components/Icon/resolve.ts
    target: _blank
---

## Overview

`Icon` renders Iconify data through Lynx's native `<svg content="…">` element. `@vyui/kit` re-exports the same primitive as both `Icon` and `VyIcon`, and the `VyUI` plugin registers `<VyIcon>` globally.

No icon collection is bundled or registered by default. Register the prefixes your application uses before rendering string names.

::component-code
---
name: icon-example
height: 160px
---
::

## Usage

::component-code
---
name: icon-example
height: 160px
---
::

You can import the primitive and resolver utilities directly from core.

```ts
import {
  Icon,
  registerIconSet,
  resolveIconSvg,
  type IconProps,
  type ResolveIconOptions,
} from '@vyui/core'
```

## Icon registration

Install an Iconify JSON collection and register it during application startup, before mounting the app.

::code-group
```bash [pnpm]
pnpm add @iconify-json/lucide
```

```bash [npm]
npm install @iconify-json/lucide
```

```bash [yarn]
yarn add @iconify-json/lucide
```

```bash [bun]
bun add @iconify-json/lucide
```
::

```ts [src/index.ts]
import { registerIconSet } from '@vyui/core'
import { createApp } from 'vue-lynx'
import { VyUI } from '@vyui/kit'
import lucide from '@iconify-json/lucide/icons.json'
import App from './App.vue'

registerIconSet('lucide', lucide)

const app = createApp(App)
app.use(VyUI)
app.mount()
```

The registration key must match the prefix used by icon names. Register each collection once; registering a prefix again replaces its data and clears the resolver cache.

### Register only the icons you use

Iconify collection JSON is a single payload and does not tree-shake per icon. For a small application, register a hand-crafted `IconifyJSON` subset instead of importing the full collection.

```ts
import { registerIconSet } from '@vyui/core'

registerIconSet('lucide', {
  prefix: 'lucide',
  width: 24,
  height: 24,
  icons: {
    check: {
      body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>',
    },
    search: {
      body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-4.34-4.34"/><circle cx="11" cy="11" r="8"/></g>',
    },
  },
})
```

Aliases and other standard `IconifyJSON` fields can be included when required.

## Name formats

The resolver accepts three string formats:

```vue
<VyIcon name="i-lucide-folder" />
<VyIcon name="lucide:folder" />
<VyIcon name="lucide-folder" />
```

The `i-` and bare dash forms split on the first dash and therefore only support alphanumeric prefixes. Use the colon form for a hyphenated prefix.

```vue
<VyIcon name="simple-icons:bytedance" />
```

An unregistered prefix, missing icon, or unparseable name resolves to `null` and renders no SVG.

## Size and color

`size` controls both SVG dimensions in pixels. Numbers and numeric strings are accepted; an invalid value falls back to `16`.

::component-code
---
name: icon-size
height: 160px
---
::

Lynx SVG cannot inherit `currentColor`. The resolver replaces `currentColor` inside the registered SVG data with the explicit `color` value. Icons that use fixed fills or strokes are not recolored by this replacement.

Safe CSS color syntaxes such as named colors, hex, `rgb()`, and `hsl()` are accepted. A value containing SVG-markup characters is ignored and produces a development warning.

::component-code
---
name: icon-color
height: 160px
---
::

### Theme-resolved colors

`VyIcon` itself has no semantic `color` variant or theme. Kit components such as `VyInput`, `VyButton`, and `VyAlert` resolve their semantic palette to a literal color and pass it into the icon primitive.

When using `VyIcon` directly, resolve the final color in your application or pass the `iconColor` supplied by a component slot.

```vue
<VyInput v-model="query" color="info">
  <template #leading="{ iconColor }">
    <VyIcon name="i-lucide-search" :color="iconColor" />
  </template>
</VyInput>
```

Changing `appConfig.ui.icons` changes semantic icon names used by kit components, such as the default loading icon. It does not register icon data and does not theme standalone `VyIcon` instances.

## Custom component escape hatch

Pass a Vue component instead of a string to render it directly.

```vue
<script setup lang="ts">
import { VyIcon } from '@vyui/kit'
import BrandMark from './BrandMark.vue'
</script>

<template>
  <VyIcon :name="BrandMark" />
</template>
```

The component is rendered bare. `VyIcon` does not forward `size`, `color`, `class`, or other attributes into it, so the custom component owns its dimensions, color, accessibility, and Lynx rendering contract.

## Resolver API

Use `resolveIconSvg()` when another Lynx integration needs the generated standalone SVG string.

```ts
import { resolveIconSvg } from '@vyui/core'

const svg = resolveIconSvg('lucide:check', {
  size: 20,
  color: '#16a34a',
})
```

Results, including failed resolutions, are memoized by name, size, and color. Calling `registerIconSet()` clears the cache so names that previously returned `null` can resolve.

### `registerIconSet`

| Parameter | Type | Description |
| --- | --- | --- |
| `prefix` | `string` | Prefix used in icon names. |
| `data` | `IconifyJSON` | Full or partial Iconify collection data. |

Returns `void`.

### `resolveIconSvg`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | — | Icon name in a supported format. |
| `options.size` | `number` | Icon data default | SVG width and height in pixels. |
| `options.color` | `string` | `undefined` | Safe color replacing `currentColor`. |

Returns `string | null`.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string \| Component` | — | Registered Iconify name or custom Vue component. |
| `size` | `string \| number` | `16` | Width and height in pixels for a resolved string icon. |
| `color` | `string` | `undefined` | Color baked into occurrences of `currentColor`. |

For string icons, `class` is explicitly forwarded to the native `<svg>` root. Other fallthrough attributes are not part of the current primitive contract.

## Emits

This component does not emit events.

## Slots

This component does not expose slots.

## Styling and theming

`VyIcon` has no kit theme file, `ui` prop, variants, or `appConfig.ui.icon` key. Use `size` and `color` for native SVG dimensions and paint, and use `class` for supported layout or animation utilities.

```vue
<VyIcon
  name="i-lucide-loader-circle"
  :size="20"
  color="#64748b"
  class="shrink-0 animate-spin"
/>
```

CSS text-color utilities do not reliably recolor the SVG on Lynx because its XML is rasterized independently. Prefer the `color` prop.

The kit icon-name registry lives at `appConfig.ui.icons` and supplies defaults such as `loading`, `check`, `close`, and chevrons to higher-level components. Override those names through the `VyUI` plugin, then register every prefix referenced by the override.

```ts
app.use(VyUI, {
  ui: {
    icons: {
      loading: 'tabler:loader-2',
      close: 'tabler:x',
    },
  },
})
```

## Accessibility

Treat standalone icons as decorative unless they communicate information unavailable in nearby text. The current string-icon branch forwards `class`, but not accessibility labels or roles, to the native SVG. Put meaningful icons inside a labeled control or labeled wrapper rather than relying on attributes placed on `VyIcon`.

For an icon-only button, label the button itself.

```vue
<VyButton
  icon="i-lucide-search"
  accessibility-label="Search"
/>
```

Do not rely on color alone to communicate status. Pair status icons with visible text, and ensure custom component icons implement their own accessibility contract.

## Platform notes

- The primitive uses Lynx's native `<svg content="…">` API rather than a DOM SVG component or CSS mask.
- A data-URI `<image>` may work on web but does not render consistently on native iOS or Android, which is why the generated XML is passed directly to `<svg>`.
- `currentColor` cannot cross into the rasterized SVG XML, so pass a literal `color` when tinting is required.
- Full Iconify JSON collections can significantly increase the JavaScript bundle; register a subset when bundle size matters.
- Resolution is synchronous and local. There is no network icon loader or automatic fallback.
- The same registered data and name formats work across iOS, Android, and the Lynx web runtime.

## Related components

- [`Input`](/components/input) for themed leading and trailing icons.
- `Button`, `Badge`, and `Alert` for components with built-in icon positions.
- [`Icons setup`](/getting-started/icons) for the project-level installation overview.
