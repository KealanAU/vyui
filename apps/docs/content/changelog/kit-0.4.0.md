---
title: "@vyui/kit v0.4.0"
description: "Collapse the modal / non-modal content wrappers and make modal mean something."
date: "2026-09-08"
package: kit
version: "v0.4.0"
changelogOrder: 4000
---

### Minor Changes

- Collapse the modal / non-modal content wrappers and make `modal` mean something. ([#201](https://github.com/KealanAU/vyui/pull/201))
  
  `DialogContentModal` and `DialogContentNonModal` were code-identical, as were
  `PopoverContentModal` and `PopoverContentNonModal` — the split only mirrored
  reka-ui's DOM structure, where the difference is scroll-lock and focus
  bookkeeping that has no Lynx equivalent. `DialogContentNonModal` and
  `PopoverContentNonModal` are removed; `DialogContent` / `PopoverContent` render
  the single remaining wrapper unconditionally. `AlertDialog` already shipped this
  shape.
  
  Modality now drives the one lever Lynx does have: `exclusiveFocus`. Both content
  impls hardcoded `exclusiveFocus: true`, so a non-modal dialog or popover still
  confined assistive tech to itself. They now follow the root's `modal` flag.
  
  - `Dialog` is unaffected by default (`modal` defaults to `true`).
  - `Popover` — and `VyPopover` in anchor presentation — defaults to `modal: false`,
    so its content no longer takes exclusive accessibility focus unless you pass
    `modal`. Sheet presentation is unchanged (always modal).
- Drop the props that existed only for reka-ui / Nuxt UI parity and were ([#201](https://github.com/KealanAU/vyui/pull/201))
  documented as never read: `ComboboxPortal`'s `to` / `forceMount` / `disabled`,
  `DialogPortal`'s and `SelectPortal`'s `to`, `trapFocus` on the Dialog and
  AlertDialog content impls, `VyPopover`'s `mode` / `openDelay` / `closeDelay` /
  `arrow` / `portal` (plus the unrendered `arrow` theme slot), `presentation` on
  `VySelect` and `VyCombobox`, `type` and `autofocus` on `VyButton`, `portal` on
  `VyModal` and `VyDrawer`, and `VyDrawer`'s `direction` alias for `side`.
  
  Passing any of them was already a no-op, so behavior is unchanged; they now
  land in `$attrs` instead of being declared props. Use `side` in place of
  `VyDrawer`'s `direction`.
  
  Drop `forceMount` everywhere it was plumbed (`Presence`, `usePresenceGroup`,
  and the Accordion / Checkbox / Collapsible / Combobox / Dialog / DropdownMenu /
  Popover / RadioGroup / Tabs content + indicator components). Nothing in the kit,
  the examples, or the docs ever set it; `unmountOnHide` covers the keep-mounted
  case.
  
  Deduplicate three copies of shared logic: `normalizeRect` / `toNumber` now live
  once in `useResizeObserver` (`useElementRect` imports them), the kit's default
  `AppConfig` literal lives once in `useAppConfig` (`provideVyUI` imports it), and
  the alert theme's `iconFg` routes through `iconFgFromToken` like the button,
  tabs, toggle, and toggle-group themes.
  
  Remove `defineVyuiConfig` and the `@vyui/kit/config` entry. It only spread
  `{ theme, components }` into `{ ui: { ...theme, ...components } }`, which is the
  shape you can author directly — `createVyuiPreset` and `provideVyUI` /
  `app.use(VyUI)` still take that same `{ ui }` object:
  
  ```ts
  // vyui.config.ts
  import type { VyUIPluginOptions } from '@vyui/kit'
  
  export default {
    ui: { primary: 'orange', button: { slots: { base: 'rounded-xl' } } },
  } satisfies VyUIPluginOptions
  ```

### Patch Changes

- Type the `class` and `ui` props on every styled `@vyui/kit` component as ([#200](https://github.com/KealanAU/vyui/pull/200))
  `ClassValue` (re-exported from `useStyledComponent`) instead of `any`, so a
  wrong class value is caught at the call site. `ui` slot keys were already
  checked; their values now are too.
  
  Read the Lynx `SystemInfo` / `lynx` globals through `globalThis` with their
  `@lynx-js/types` declarations instead of casting to `any`. No runtime change —
  the `globalThis.` access still guards hosts where the global is absent.
- Delete five unused surfaces and collapse AlertDialog onto Dialog. ([#202](https://github.com/KealanAU/vyui/pull/202))
  
  Removed (zero consumers in kit, examples, docs, or fixtures):
  
  - `Pagination*` and its `utils` — a web pattern with no mobile use.
  - `List` / `ListItem` — its own header pointed at `FeedList`; use Lynx's `<list>` directly.
  - `useAnimate` — exported, undocumented, never called.
  - `useDateFormatter` and the `@vyui/core/date` subpath (`calendar`, `comparators`, `types`), dropping the `@internationalized/date` dependency. `VyCalendar` already runs on kit's own ISO helpers. `DateFormatter` and `installIntlPolyfill` are unaffected.
  
  `AlertDialog` was a 14-file, 1052-line fork of `Dialog`. `DialogRoot` gains a
  `role` prop (`'dialog' | 'alertdialog'`); `alertdialog` announces alert-dialog
  semantics AND makes the dialog undismissable by an outside tap, on both the
  content backdrop and `DialogOverlay`. Every `AlertDialog*` name stays exported —
  `AlertDialogRoot` presets the role, the rest are aliases over the matching
  Dialog primitive. `<Dialog role="alertdialog">` is now equivalent.
  
  Behavior changes for existing `AlertDialog` users:
  
  - `AlertDialogAction` and `AlertDialogCancel` are both `DialogClose`. `Action`'s `click` emit still fires; `Cancel` gained one.
  - `AlertDialogRoot` gains `modal` (default `true`) and no longer exposes `open` via a template ref.
  - `AlertDialogContent` no longer ships built-in fade/zoom keyframes — core is headless, so supply them like you do for `Dialog`.
  - `DialogClose` no longer forces `accessibility-label="Close"`; it announces its own child text. Pass the label explicitly on icon-only closers. `VyModal` does this for you.
- Merge `SliderHorizontal` / `SliderVertical` into one `SliderOrientation` ([#202](https://github.com/KealanAU/vyui/pull/202))
  component. The orientation context loses `direction` (provided by both, read by
  nobody) and `size`, which was non-reactive and whose two readers already had the
  same information in `startEdge` — so orientation now survives a live switch
  instead of being frozen at mount.
  
  Expose `hitSlop` on `SliderRoot` and `VySlider` (default `"16px"`, unchanged).
  It widens the native touch target a drag can start from; it does not widen the
  element's box, so growing the root's cross-axis padding is still the sturdier
  fix when an ancestor `<scroll-view>` claims a vertical drag.
- Drop the non-functional `children` / `childrenIcon` surface from `VyDropdownMenu`. Nested items were never rendered — an item with `children` drew a trailing chevron that did nothing — so the prop, its icon, and the now-unreachable `itemTrailingIcon` theme slot are gone. Submenus need `DropdownMenuSub` from `@vyui/core` wired through the items renderer; that work is unstarted. ([#200](https://github.com/KealanAU/vyui/pull/200))
  
  Type `useStyledComponent`'s `ui` as `ReturnType<ThemeTV<TTheme>>` instead of `any`, so slot keys are checked at the call site.
  
  Add `w-full` to the drawer `footer` slot. A `flex-row` row inside the `flex-col` scaffold doesn't stretch on Lynx, so footers with a `flex-1` child collapsed to content width.
- Updated dependencies [[`80882aa`](https://github.com/KealanAU/vyui/commit/80882aaa77c7bc37a2d378a4916191b8c18fcd8c), [`1fc0210`](https://github.com/KealanAU/vyui/commit/1fc0210a2ce0b2338fe732bbec497cb86373f6d0), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`7d97fdf`](https://github.com/KealanAU/vyui/commit/7d97fdf6300ac78f42d30d3ebef7e6a647bf6aa7), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`1fc0210`](https://github.com/KealanAU/vyui/commit/1fc0210a2ce0b2338fe732bbec497cb86373f6d0), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`7d97fdf`](https://github.com/KealanAU/vyui/commit/7d97fdf6300ac78f42d30d3ebef7e6a647bf6aa7), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`7d97fdf`](https://github.com/KealanAU/vyui/commit/7d97fdf6300ac78f42d30d3ebef7e6a647bf6aa7), [`0475310`](https://github.com/KealanAU/vyui/commit/0475310aa01524f0720516d94a932968c1c57ecc), [`315ef4d`](https://github.com/KealanAU/vyui/commit/315ef4d1920a33f02539eafb234691ffa3bbd0f3), [`1fc0210`](https://github.com/KealanAU/vyui/commit/1fc0210a2ce0b2338fe732bbec497cb86373f6d0)]:
  - @vyui/core@1.0.0
