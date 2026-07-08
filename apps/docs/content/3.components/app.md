---
title: App
description: The recommended app-root wrapper — owns dark mode, mounts the overlay host, and reports viewport size.
navigation:
  icon: i-lucide-smartphone
package: kit
links:
  - label: Source
    icon: i-simple-icons-github
    to: https://github.com/KealanAU/vyui/blob/main/packages/kit/src/components/App.vue
    target: _blank
---

## Overview

`VyApp` is the recommended root wrapper for a Vy UI app. It owns the dark-mode class-toggle + remount contract that [`useColorMode`](/theming) requires of an app root, mounts the shared overlay host so teleporting surfaces work with zero setup, and reports the root's size whenever it changes.

```vue [src/App.vue]
<script setup lang="ts">
import { VyApp } from '@vyui/kit'
</script>

<template>
  <VyApp>
    <!-- your screens -->
  </VyApp>
</template>
```

```ts [src/index.ts]
import { createApp } from '@lynx-js/vue'
import { VyUI } from '@vyui/kit'
import App from './App.vue'

createApp(App).use(VyUI).mount('#app')
```

::callout{icon="i-lucide-box"}
Reach for `VyApp` once, at the top of the tree. Everything it wires up — the dark ramp, the overlay host, the viewport signal — applies to the whole app below it.
::

## Usage

### Dark mode

`VyApp` reads [`useColorMode`](/theming)'s `mode` / `isDark` and applies both pieces of the app-root contract: the `.dark` class and a `:key="mode"` remount. Lynx native only applies a class change to freshly mounted nodes, so toggling `.dark` on an already-mounted tree would not re-skin it — keying on `mode` remounts the subtree on every change, turning that platform quirk into the mechanism. You get this for free just by wrapping your app; nothing further to wire up.

### Overlay host

By default `VyApp` mounts `OverlayRoot` (from `@vyui/core`) as its first child, so `Modal`, `Tray`, `Toast`, and other teleporting components work without any hand-wiring. Set `overlays` to `false` and place your own `<OverlayRoot />` if you need control over where it sits in the tree.

```vue
<template>
  <VyApp :overlays="false">
    <OverlayRoot />
    <!-- your screens -->
  </VyApp>
</template>
```

### Radius token

Pass `radius` to set `--ui-radius` (in rem) on the root, overriding the default shipped in `@vyui/kit/style.css`.

```vue
<VyApp :radius="0.75">
  <!-- your screens -->
</VyApp>
```

### Viewport size

`VyApp` emits `viewport-change` with `{ width, height }` on mount and on every resize (rotation, split-screen), sourced from the background-thread `layoutchange` event. `main-thread-*` attrs do not reliably attach to this root, so this is the supported way to observe root size.

```vue
<VyApp @viewport-change="(size) => console.log(size.width, size.height)">
  <!-- your screens -->
</VyApp>
```

### Reading color mode from the slot

The default slot receives `{ mode, isDark }` — the same values `useColorMode()` returns — so a descendant can react to color mode without importing the composable itself.

```vue
<VyApp v-slot="{ mode, isDark }">
  <text>Current mode: {{ mode }} ({{ isDark ? 'dark' : 'light' }})</text>
</VyApp>
```

## Features and behavior

- Applies the `.dark` class and a `:key="mode"` remount together, so color mode toggles correctly on Lynx native and on web.
- Mounts `OverlayRoot` as the first child by default; opt out with `overlays="false"` to place it yourself.
- `radius` sets `--ui-radius` inline, in rem.
- Emits `viewport-change` on mount and resize, from the background-thread `layoutchange` event.
- The default slot exposes `{ mode, isDark }` for consumers that want color mode without calling `useColorMode()` directly.

## Props

::component-props{name="App"}
::

## Emits

::component-emits{name="App"}
::

## Slots

::component-slots{name="App"}
::

## Styling and theming

Override globally through `appConfig.ui.app` or locally with the `ui` prop.

| UI slot | Purpose |
| --- | --- |
| `root` | The app-root element. Paints the `bg-default` surface token and fills the viewport (`w-full h-full`). |

## Platform notes

- The dark-mode remount relies on Lynx native applying class changes only to freshly mounted nodes — `:key="mode"` turns that into the toggle mechanism. See [`useColorMode`](/theming) for the full rationale.
- `viewport-change` is sourced from the background-thread `layoutchange` event rather than a `main-thread-*` binding, because those attrs do not reliably fall through onto this root.
- Components that teleport (`Modal`, `Tray`, `Toast`, …) need an `OverlayRoot` somewhere in the tree to render at all — `VyApp` provides one by default so this is rarely something you need to think about.

## Related components

- [`Tray`](/components/tray) for a bottom sheet mounted through the overlay host `VyApp` provides.
- [`Modal`](/components/modal) for a centered blocking dialog, same overlay host.
- [Theming](/theming) for dark mode and runtime theme overrides.
