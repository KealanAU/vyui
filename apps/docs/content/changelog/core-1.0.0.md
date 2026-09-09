---
title: "@vyui/core v1.0.0"
description: "Delete five unused surfaces and collapse AlertDialog onto Dialog."
date: "2026-09-08"
package: core
version: "v1.0.0"
changelogOrder: 1000000
---

### Major Changes

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

- Remove the main-thread half of `useTouchEmulation` (the `onTouch*MT` options and the `main-thread-*` handler keys). It emitted `main-thread:bind*` keys, which vue-lynx's `patchProp` never recognised — only the `main-thread-` prefix is, so the worklets were never attached and the callbacks could not have fired on any platform. Removes exported type members, but nothing could have depended on the behaviour. The background-thread half is unchanged. MT gestures bind `:main-thread-bind*` in the SFC with the worklets inlined there. ([#198](https://github.com/KealanAU/vyui/pull/198))

- Remove `useLocale`, which had no callers. It read `ConfigProvider`'s `locale` context and no component ever consumed it, so nothing in the library resolved a locale through it. `ConfigProvider`'s `locale` prop and context entry stay — consumers can read them directly via `injectConfigProviderContext`. ([#200](https://github.com/KealanAU/vyui/pull/200))

- Drop the `@vueuse/core` runtime dependency. Five helpers were in use: `useVModel` ([#202](https://github.com/KealanAU/vyui/pull/202))
  now ships as an internal composable (`clone` / `eventName` / `shouldEmit` and the
  implicit `getCurrentInstance` emit are gone — nothing used them), and
  `unrefElement`, `useMounted`, `reactiveOmit` and `reactivePick` are inlined at
  their call sites. `@vyui/core` is a Lynx runtime with no DOM, so a DOM-shaped
  dependency is one fewer thing for the main-thread bundle to reach.
- Type the `class` and `ui` props on every styled `@vyui/kit` component as ([#200](https://github.com/KealanAU/vyui/pull/200))
  `ClassValue` (re-exported from `useStyledComponent`) instead of `any`, so a
  wrong class value is caught at the call site. `ui` slot keys were already
  checked; their values now are too.
  
  Read the Lynx `SystemInfo` / `lynx` globals through `globalThis` with their
  `@lynx-js/types` declarations instead of casting to `any`. No runtime change —
  the `globalThis.` access still guards hosts where the global is absent.
- Remove four dead exports and one prop alias: ([#201](https://github.com/KealanAU/vyui/pull/201))
  
  - `IslandContainer` — a styled pill wrapper with zero consumers, superseded by
    `VyIsland` / `VyIslandGroup` in `@vyui/kit`. It was the only importer of
    `tailwind-merge`, which is now off core's dependency list.
  - `useSize` — built on `ResizeObserver` / `offsetWidth`, neither of which exists
    on Lynx, so it never reported a size. Its only caller was `SliderThumbImpl`'s
    `getThumbInBoundsOffset` correction, which was therefore always `0`; the
    helper, the offset, and `SliderRoot`'s now-unread `thumbAlignment` prop (and
    its `ThumbAlignment` type) go with it. Thumb centring is unchanged — the
    `translate(±50%)` on the anchoring edge already does it.
  - `<Presence>`'s `present` prop — a v1 alias for `show`. Pass `show` instead;
    the `present` slot prop is unaffected.
- Export the injection-context types that were declared but never re-exported. `injectAccordionRootContext` and 13 siblings were reachable from `@vyui/core` while the type each one returns was not, so consumers building custom parts could call the function but not name its result. Adds `AccordionRootContext`, `DropdownMenu{Root,Sub,CheckboxItem,RadioGroup,RadioItem}Context`, `PinInputRootContext`, `PopoverRootContext`, `SliderRootContext`, `Stepper{Root,Item}Context`, `SwitchRootContext`, `TabsRootContext`, and `ToastRootContext`, plus `ThumbAlignment` (referenced by both `SliderRootProps` and `SliderRootContext`). `RatingRootContext` stays internal — its inject function is not exported either. ([#200](https://github.com/KealanAU/vyui/pull/200))
  
  Also drops dead weight: the orphaned `Presence/story/_Toggle.vue` and `RadioGroup/story/_Radio.vue` test fixtures (no importer; the live ones are `Toggle/story/_Toggle.vue` and `RadioGroup/story/_RadioGroup.vue`), the `src/test` barrel whose only member was a one-line `sleep` used by a single test, and three unused devDependencies (`@iconify/vue`, `@testing-library/vue`, `@vue/compiler-sfc` — core uses `@iconify/utils`, `@iconify/types`, and `@testing-library/dom`).
- Remove unreferenced internals: the `_ConfigProvider.vue` demo scrap, 11 orphaned `story/*.vue` fixtures, the `shared/component` barrel (`BaseSeparator.vue` itself is unchanged and still imported directly), the unused `handleSubmit` test helper, and the unused `TAP_THRESHOLD` constant. `_Switch.vue` moves into `Switch/story/` so it stops leaking a generated API page into the docs site. No published runtime export changes. ([#200](https://github.com/KealanAU/vyui/pull/200))

- Remove the `isBrowser` constant and the empty `@vyui/core/internal` subpath. `isBrowser` was a `typeof document` probe left over from a DOM-era port, unreferenced in a library that targets Lynx native. The `internal` entry exported nothing (`export {}`) and was held open for a Menu component that never landed, citing a plan file that no longer exists. Removes a published subpath. ([#200](https://github.com/KealanAU/vyui/pull/200))

- Remove `interpolate`, `interpolateJS`, `Extrapolation`, `ExtrapolationConfig`, and `ExtrapolationType`. `interpolate` carried a `'main thread'` directive, and cross-file worklet-to-worklet calls do not resolve — so the gesture worklets that need a clamped lerp could never call it, in this repo or a consumer's. Its only working path was a background-to-main-thread hop, which defeats the 60fps case it existed for. The background variant was callable but unused, and its shared enum only served the pair. Removes exported members from `@vyui/core/shared`. ([#200](https://github.com/KealanAU/vyui/pull/200))

- Merge `SliderHorizontal` / `SliderVertical` into one `SliderOrientation` ([#202](https://github.com/KealanAU/vyui/pull/202))
  component. The orientation context loses `direction` (provided by both, read by
  nobody) and `size`, which was non-reactive and whose two readers already had the
  same information in `startEdge` — so orientation now survives a live switch
  instead of being frozen at mount.
  
  Expose `hitSlop` on `SliderRoot` and `VySlider` (default `"16px"`, unchanged).
  It widens the native touch target a drag can start from; it does not widen the
  element's box, so growing the root's cross-axis padding is still the sturdier
  fix when an ancestor `<scroll-view>` claims a vertical drag.
- Fix FeedList pull-to-refresh never arming: the rubber-band was given the trigger threshold as its band width, so the painted offset saturated at exactly the threshold and `release to refresh` was only reachable on a knife-edge 2x-threshold drag. The band is now 2x the threshold, so a pull of `refreshThreshold` px arms the release. ([`0475310`](https://github.com/KealanAU/vyui/commit/0475310aa01524f0720516d94a932968c1c57ecc))

- Remove `getDragPoint`, `isMouseReleased`, and the `DragPoint` type. Nothing referenced them: the desktop mouse-drag work replaced the background-thread coordinate helpers with per-component main-thread coord cores, and the module's own header still named Slider as its consumer and documented the superseded `:global-bindmousemove` pattern. Removes exported members from `@vyui/core`. ([#200](https://github.com/KealanAU/vyui/pull/200))
