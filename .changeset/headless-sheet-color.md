---
"@vyui/core": patch
"@vyui/kit": patch
---

Fix every Sheet-backed surface rendering white in dark mode. `@vyui/core` was shipping color it can't ship.

`.vyui-sheet__content` hardcoded `background-color: #fff`, which beat the consumer's `bg-default` on source order and pinned **drawer, tray, action sheet, select, combobox and popover** to white in both color modes. `SheetBackdropImpl` and `SwipeAction` set `backgroundColor` **inline**, which no class can outrank at all — so a theme's dim or row color on those elements was dead on arrival. It only read as a dark-mode bug because white-on-white is invisible.

All three now ship no color, matching the "No defaults — pass `backgroundColor` here" contract every sibling overlay already documents.

**Breaking for bare `@vyui/core` consumers:** `SheetContent`, `SheetBackdrop` and `SwipeAction` no longer paint a background. Supply one (`@vyui/kit` already does on every slot). The `SwipeAction` row in particular must stay opaque or the actions behind it show through.

Also in `@vyui/kit`: `actionSheet`'s `content` slot gains `bg-default`. It was the one Sheet theme silently relying on core's white.

The reason it stayed hidden: **`SheetContent` and `SheetBackdrop` were dropping the consumer's `class` entirely.** `OverlayPortal` renders nothing in place — it registers its slot for `OverlayRoot` to paint elsewhere — so there is no root element for `class` / `style` to fall through to, and Vue discards them without a warning. Every kit theme class on a sheet panel (`bg-default`, borders, radius) was being thrown away, and core's hardcoded `#fff` / `position: fixed` / `z-index` stood in for them. Both now forward `useAttrs()` onto the impl with `inheritAttrs: false`, matching `DialogContentModal`.

Guarded by `components/headless-color.test.ts` (fails if any core component declares a literal background color — `var()` is allowed, `story/` is exempt) and a case in `OverlayRoot.test.ts` pinning the attr-forwarding contract for `OverlayPortal` consumers.
