---
title: "@vyui/kit v0.1.0"
description: "0610d70: Input/Textarea: surface the on-screen keyboard via a normalized keyboard event."
date: "2026-06-25"
package: kit
version: "v0.1.0"
changelogOrder: 1000
---

### Minor Changes

- 0610d70: Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

  - `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
  - This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
  - `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.

### Patch Changes

- 300e34f: Add small horizontal (landscape) mode support — the work that gets the kit-demo running on mobile in landscape. Compact, viewport-safe layouts for overlays, sheets, menus, tabs, steppers, islands, cards, alerts, and toasts. Select and Combobox sheet structure is now fully themeable for responsive overrides.
- 0610d70: Input: forward `@focus` and `@blur` events.

  - The core `Input` emits `focus`/`blur` (with the current value), but the `VyInput` wrapper only re-emitted `update:modelValue` and `confirm`, so consumers couldn't react to focus changes (e.g. to drive a keyboard-aware lift). It now forwards both.

- 0610d70: IslandButton: bake the icon color so the theme's foreground actually applies.

  - `IslandButton` rendered its glyph through Lynx's `<svg>`, which rasterizes the XML and can't inherit `currentColor` — so the `text-slate-*` utility on the `leadingIcon` slot (and the darker `text-slate-900` active shade) never reached the icon, leaving it stuck on its default fill (invisible on dark/active pills).
  - It now resolves the foreground utility off the merged `leadingIcon` class — honoring the active state and any consumer `ui.leadingIcon` override — and passes it to `<VyIcon :color>`, matching the pattern already used by `Button`, `Input`, `Alert`, and `Combobox`. Non-palette colors (e.g. arbitrary `text-[#abc]`) fall back to the icon's `currentColor` default.

- 491db6a: Default input chrome to neutral: form controls no longer paint a primary border or icon by default.

  - Resting border on `Input`, `Textarea`, `Select`, `Combobox`, `NumberField` and `PinInput` is now neutral (`border-neutral-200`) regardless of `color` — matching the no-focus-state reality on Lynx. The colored border stays available as opt-in via the `highlight` prop.
  - Leading/trailing icons (and `NumberField` steppers) now default to neutral (dimmed) instead of the `color` palette; override per-icon with your own `:color` via the `leading` / `trailing` slots.
  - `RadioGroup`: space the control from its label with `gap-2` on the item instead of `ms-2` on the wrapper — Lynx ignores logical inline margins, which collapsed the dot and text together.

- baf0692: Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
- 300e34f: Keep sheet snap and drag geometry synchronized with dynamic viewport changes, and make kit swipers fill their measured container when no explicit item width is provided.
- 14e0722: Add `@vyui/cli`, a shadcn-style CLI that copies `@vyui/kit` components (and their dependencies) into a project from a style-namespaced registry, rewriting imports to the consumer's aliases.

  - `init` / `add` / `styles` commands; tsconfig/jsconfig alias + package-manager detection.
  - Shadcn-style project preflight and automatic, idempotent app-entry/Tailwind wiring.
  - `list`, `view`, `info`, interactive `add`, and `--dry-run` discovery/preview workflows.
  - Safe upgrades: explicit components may be overwritten while shared files and transitive dependencies remain user-owned.
  - Registry targets are contained to the project root (rejects `../` / absolute / null-byte paths).
  - Cyclic registry dependency graphs resolve instead of deadlocking.

  kit: drive the switch thumb with flex justification instead of `translate-x-*` (Lynx drops `transform` painting), and reset the native `<textarea>` user-agent border.

- 300e34f: Make vertical tabs reserve a navigation rail and let their content fill the remaining width. Vertical triggers no longer inherit the horizontal `pill` variant's `flex-1` stretch — they keep their natural height and left-align their icon/label so the rail reads as a sidebar list.
- Updated dependencies [0610d70]
- Updated dependencies [0610d70]
- Updated dependencies [baf0692]
- Updated dependencies [0610d70]
- Updated dependencies [300e34f]
  - @vyui/core@0.1.0
