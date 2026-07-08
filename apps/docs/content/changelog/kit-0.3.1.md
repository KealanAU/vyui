---
title: "@vyui/kit v0.3.1"
description: "62d9f13: Dark mode via semantic design tokens."
date: "2026-07-08"
package: kit
version: "v0.3.1"
changelogOrder: 3001
---

### Patch Changes

- 62d9f13: Dark mode via semantic design tokens.

  - New role-based token layer (the nuxt/ui + shadcn convention, Lynx-adapted): text (`text-highlighted` / `text-default` / `text-toned` / `text-muted` / `text-dimmed` / `text-inverted`), background (`bg-default` / `bg-muted` / `bg-elevated` / `bg-accented` / `bg-inverted`) and border (`border-default` / `border-muted` / `border-accented` / `border-inverted`). Each is a single-hop `var(--ui-*)` → concrete `theme()` literal, so it resolves on Lynx and flips between modes on its own.
  - Every theme migrated off raw `text-neutral-*` / `bg-neutral-*` / `border-neutral-*` onto these tokens, so a component flips in dark with zero `dark:` variants. Consumers get the same for their own chrome — write `text-muted`, not `text-neutral-500 dark:text-neutral-400`.
  - A single `.dark` class on an app-root ancestor (`useColorMode()`) redefines the tokens to their dark values; the neutral RAMP stays fixed (raw `neutral-*` is a literal shade in both modes — least surprise), and only the accent mode tier shifts `-500` → `-400`.
  - `useColorMode()` composable (`'light' | 'dark' | 'system'`, plus `isDark` / `setMode` / `toggle`) folds `'system'` to the OS appearance and follows it live on web. App-root contract: bind `:class="{ dark: colorMode.isDark }"` + `:key="colorMode.mode"` — the `:key` remount re-skins an already-mounted tree on Lynx native.
  - Mode-tier tokens hold `theme()` literals (not `var(--ui-color-*)` refs), fixing a latent two-level `var()` collapse on device. `rounded` / `shadcn` style overlays (which redeclare `:root`) gain the full token set for light AND dark.

- 3c08b29: `VyInput` now paints its colored border plus a shadow-ring while focused (tracked in JS — Lynx has no `:focus-within`), instead of only via the static `highlight` prop. The ring is a flat arbitrary `box-shadow` (`0 0 0 2px var(--ui-color-{color}-200)`) because the Lynx preset has no `ring*`/`boxShadowColor` plugins; the per-color classes are safelisted in the Tailwind preset. `highlight` still forces the same treatment on permanently.
- 4ee6a7d: Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element `@keyboard` event (the global `keyboardstatuschanged` event never reaches the vue-lynx background runtime), inputs self-register with a surrounding `KeyboardAwareRoot` without needing a `KeyboardAwareTrigger` wrap, and `VyTray`'s `keyboardAware` now also covers the body (new `'lift' | 'scroll'` modes plus `bodyScroll` ui slot) instead of silently doing nothing without a footer slot.
- d4f9b1a: Update public package and documentation copy to describe Vy UI as Lynx-native UI primitives for Vue.
- 1637c40: Sortable rows no longer drag list chrome along with the finger. The kit theme now renders each row as a transparent shell (the element core transforms) around a new `itemContent` pill slot, so only the pill visibly moves — the old `border-b` divider look is gone. `SortableItem` flips a `ui-dragging` class (+ `data-state="dragging"`) on the lifted row, and `VYUI_UI_STATES` gains `dragging` so themes can restyle the lifted pill (default: stronger pill border via `group-ui-dragging:`).
- 93c9827: Add `VyApp`, the app-root shell: owns the `dark` class + `:key` remount from `useColorMode`, mounts `OverlayRoot` (opt-out via `:overlays="false"`), sets `--ui-radius` via the `radius` prop, and emits `viewport-change` with the root layout size.

  Also export `resolveColorHex` (from the barrel and the `./provide` entry) so consumers can bake semantic colors into `VyIcon`'s `color` prop — Lynx rasterizes `<svg>`, so `text-*` classes never color an icon.

  Fix icon-only (`square`) buttons rendering off-center: vue-lynx realizes empty slot/`v-if` anchors as real zero-size nodes, so the base `gap-*` added phantom width after the icon. `square` now applies `justify-center gap-0`.

- Updated dependencies [4ee6a7d]
- Updated dependencies [d4f9b1a]
- Updated dependencies [1637c40]
  - @vyui/core@0.2.1
