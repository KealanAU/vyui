---
title: "@vyui/core v0.2.5"
description: "Fix every Sheet-backed surface rendering white in dark mode."
date: "2026-07-21"
package: core
version: "v0.2.5"
changelogOrder: 2005
---

### Patch Changes

- Fix every Sheet-backed surface rendering white in dark mode. `@vyui/core` was shipping color it can't ship. ([#154](https://github.com/KealanAU/vyui/pull/154))

  `.vyui-sheet__content` hardcoded `background-color: #fff`, which beat the consumer's `bg-default` on source order and pinned **drawer, tray, action sheet, select, combobox and popover** to white in both color modes. `SheetBackdropImpl` and `SwipeAction` set `backgroundColor` **inline**, which no class can outrank at all — so a theme's dim or row color on those elements was dead on arrival. It only read as a dark-mode bug because white-on-white is invisible.

  All three now ship no color, matching the "No defaults — pass `backgroundColor` here" contract every sibling overlay already documents.

  **Breaking for bare `@vyui/core` consumers:** `SheetContent`, `SheetBackdrop` and `SwipeAction` no longer paint a background. Supply one (`@vyui/kit` already does on every slot). The `SwipeAction` row in particular must stay opaque or the actions behind it show through.

  Also in `@vyui/kit`: `actionSheet`'s `content` slot gains `bg-default`. It was the one Sheet theme silently relying on core's white.

  The reason it stayed hidden: **`SheetContent` and `SheetBackdrop` were dropping the consumer's `class` entirely.** `OverlayPortal` renders nothing in place — it registers its slot for `OverlayRoot` to paint elsewhere — so there is no root element for `class` / `style` to fall through to, and Vue discards them without a warning. Every kit theme class on a sheet panel (`bg-default`, borders, radius) was being thrown away, and core's hardcoded `#fff` / `position: fixed` / `z-index` stood in for them. Both now forward `useAttrs()` onto the impl with `inheritAttrs: false`, matching `DialogContentModal`.

  Guarded by `components/headless-color.test.ts` (fails if any core component declares a literal background color — `var()` is allowed, `story/` is exempt) and a case in `OverlayRoot.test.ts` pinning the attr-forwarding contract for `OverlayPortal` consumers.

  `SheetHandle` also stops hardcoding the `bg-accented` class — a `@vyui/kit` token utility, meaningless in a headless package without kit's Tailwind preset, and redundant since all three kit themes already put it on their `handle` slot. The guard now covers that direction too.

- Sheet now paints through the app-root `<OverlayRoot>` so it escapes ancestor `overflow: hidden` on Lynx native (#12). ([#152](https://github.com/KealanAU/vyui/pull/152))

  `SheetContent` and `SheetBackdrop` wrap their impls in a new `<OverlayPortal>` (exported from `@vyui/core`), matching how Dialog, DropdownMenu, Combobox and Toast already portal. Presence is unchanged — the portal mounts inside it, so enter/leave animations still run to completion before unmount.

  Consumers must have an `<OverlayRoot />` at the app root; `<VyApp>` mounts one by default.
