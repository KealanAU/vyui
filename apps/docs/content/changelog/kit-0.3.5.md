---
title: "@vyui/kit v0.3.5"
description: "Fix every Sheet-backed surface rendering white in dark mode."
date: "2026-07-21"
package: kit
version: "v0.3.5"
changelogOrder: 3005
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

- Add the `lunaris` registry style, and fix four token-layer bugs the audit turned up. ([#154](https://github.com/KealanAU/vyui/pull/154))

  - `lunaris` — the LUNA design system (from [lynx-ui](https://github.com/lynx-family/lynx-ui/tree/main/luna), Apache-2.0) ported to the token layer: pure-grey canvas/paper/content chrome, rose accent, and the five `.luna-gradient-*` classes. A token-only overlay, so every base `.vue` and `theme/*.ts` is reused unchanged. LUNA's neutral variant shares this chrome byte-for-byte and differs only in accent, so it is documented as a delta in the file header rather than shipped as a second style.
  - Fix: `shadcn` and `rounded` held nested `var(--ui-color-*)` refs on the mode tier, which collapse on Lynx native (one level of `var()` only), so consumer-written `bg-primary` / `text-error` painted nothing on device.
  - Fix: `shadcn`'s `primary` now follows `--base-color` like `neutral` does. It was pinned to `zinc` while surfaces tracked the chosen gray, producing combinations shadcn/ui can't express (zinc accent on stone surfaces).
  - Fix: `resolveColorHex` now resolves shade-less colors (`black`, `white`). They are single strings in `tailwindcss/colors`, so indexing them by shade fell through to the slate-500 fallback — a monochrome accent painted black surfaces with slate-blue baked SVG icons on them.
  - Fix: `init` warns when a chosen `--base-color` can't apply because the style ships its own palette, instead of silently ignoring it.
  - Guards: registry tests now assert every shipped style declares the full 120-token surface, declares no nested `var()` value, and that `rounded` differs from the base in `--ui-radius` alone.

  Install with `vyui init --style lunaris`.

- Fix the overlay dim: `modal`, `drawer`, `tray` and `actionSheet` all painted no scrim at all. ([#154](https://github.com/KealanAU/vyui/pull/154))

  Their `overlay` slot used an alpha modifier on a semantic color (`bg-neutral-900/50`, `bg-neutral-900/40`). The Tailwind preset maps semantic colors to raw `var()` strings with no `<alpha-value>` placeholder, so Tailwind 3 skips generating those utilities entirely — the class resolved to no CSS and the element painted nothing. All four now use `bg-black/50`, which parses to rgb so the modifier applies.

  Most visible in dark mode, where a `bg-default` panel over an undimmed `bg-default` page had nothing separating it.

  Guarded by `theme/alpha-modifier.test.ts`, which fails if any theme file reintroduces an alpha modifier on a semantic color.

- Updated dependencies [[`3298de9`](https://github.com/KealanAU/vyui/commit/3298de9acda1e46e36c1402fdd5708bc5eff7131), [`9d82f23`](https://github.com/KealanAU/vyui/commit/9d82f23af16982193202849682cf13b0c4682d1f)]:
  - @vyui/core@0.2.5
