# @vyui/core

## 0.2.7

### Patch Changes

- Drive every gesture surface from mouse events on Lynx web, and fix Sortable's ([#161](https://github.com/KealanAU/vyui/pull/161))
  drop.

  Lynx web dispatches raw mouse events and never synthesizes touch from them, so
  touch-only worklets left every drag surface inert in a desktop browser. Each
  gesture core now takes plain coordinates, with thin touch and mouse wrappers
  over it: `Draggable`, `Slider`, `Swiper`, `SwipeAction`, `Sheet`, `Toast` swipe,
  `Sortable`, `FeedList` pull-to-refresh, and `ScrollView`'s custom bounce.
  Release is explicit-buttons-only, a 500ms guard swallows the compatibility
  mousedown a touch browser replays after a tap, and no `mouseleave` is bound (it
  doesn't bubble, so per-element delivery is unreliable on the Lynx dispatch
  path). The pull and the bounce only engage at an edge, so binding mouse on
  those two doesn't disturb ordinary wheel scrolling.

  `ScrollView`'s bounce also moved off `lynx.querySelector('#id')` onto
  `main-thread-ref` handles. That selector exists only on the native main thread —
  web-core's main-thread `lynx` object has no `querySelector` — so on web every
  call threw and took the whole bounce worklet down with it.

  Sortable fixes on top of that:

  - The lifted row gets `zIndex` from its background-side dragging state instead
    of painting in DOM order, so dragging down no longer slides it under the rows
    it passes — where they swallowed the pointer and the gesture's own
    move/up worklets stopped arriving.
  - Release settles the row into its target slot and re-runs the sibling shift
    for the final velocity-adjusted target; the transforms are cleared from the
    background once the reorder has rendered. Clearing them on the main thread at
    release repainted the pre-drag order for the frames the commit took to
    round-trip, which read as the list snapping back.
  - `longPressMs` defaults to 150 (was 250).

- Fix `List.scrollIntoId` throwing on Lynx web, and restore its bottom/middle ([#161](https://github.com/KealanAU/vyui/pull/161))
  alignment everywhere.

  The worklet reached for `lynx.querySelector('#id')` three times. That global
  selector API exists only on the native main thread — web-core's MT `lynx`
  object has no `querySelector` — so the first call raised a `TypeError` and took
  the whole worklet with it, and the list scrolled nowhere.

  Two of those lookups were for the `<list>` itself, which the component owns, so
  they now go through a `main-thread-ref` instead. That works on both platforms:
  web-elements' `<x-list>` implements `scrollToPosition` as a real DOM method,
  which is what `__InvokeUIMethod` dispatches to. The third targets an arbitrary
  consumer-owned child, where the global selector is the only route, so it is
  feature-checked. When it is absent the scroll keeps its step-1 landing and
  still honours `offset` — identical to what `alignTo: 'none'` already produces —
  rather than aborting. Web's `boundingClientRect` ignores `relativeTo` anyway,
  so there is nothing meaningful to measure against there.

  Separately, the list's `layoutchange` worklet was bound as
  `:main-thread:bindlayoutchange`. vue-lynx only recognises the `main-thread-`
  prefix, so the colon form parsed as an ordinary prop and the handler never
  attached — `listHeightMT` / `listWidthMT` sat at 0 on every platform, which
  silently broke `alignTo: 'bottom'` and `alignTo: 'middle'`. Now bound with the
  hyphen form, with a test that fails on any `main-thread:` binding in core.

- Repo-wide over-engineering cleanup. Migrate all 38 `@vyui/kit` components off the internal `defineThemeBuilder` helper onto the existing `useStyledComponent` composable and delete the helper. Remove dead code from `@vyui/core` (the `useWarning` no-op, and the unused `areEqual`/`findValuesBetween`/`mtsLog`/`get`/`noop` utils) and simplify `handleAndDispatchCustomEvent`. In `@vyui/cli`, drop the fuzzy "did you mean" suggestion from the unknown-component error (which already lists every available component) and simplify dependency resolution. No public component API changes. ([#158](https://github.com/KealanAU/vyui/pull/158))

- Fix `<Presence>` wedging permanently on web when an animation end/cancel event ([#161](https://github.com/KealanAU/vyui/pull/161))
  is lost, and restore parity with upstream `lynx-family/lynx-ui` on the
  reopen-during-close path.

  - `handleKFStart`/`handleTransitionStart` no longer bump the entering/leaving
    loop ids. Bumping killed the frame watchdog the instant any animation started,
    leaving the machine trusting an end event that web does not reliably deliver —
    a child unmounted mid-transition never fires one, and DOM bubbling feeds child
    animation events into these handlers to begin with. A stuck `Leaving` kept the
    invisible backdrop mounted, swallowing every tap under it.
  - Both watchdogs now poll through in-flight animations and force-resolve past a
    `MAX_STUCK_MS` (3s) wall-clock ceiling. Wall-clock rather than frames because
    rAF cadence varies across environments.
  - `show` flipping back to `true` during `Leaving` now remounts via `restartShow()`
    instead of tearing down. Previously a reopen racing `Leaving` → `Left` stranded
    `show=true` with nothing mounted and the trigger went permanently dead.
  - `onOpen`/`onClose` are deduped through `hasNotifiedOpen`, so a
    reopen-during-close that routes back through `Entered` doesn't double-fire.
  - A close that races the enter animation no longer cuts straight to `Leaving`.
    The exit keyframe starts from the element's underlying (fully-open) value, so
    swapping mid-enter snapped the element open and played the exit from there —
    the action sheet flashing up before sliding back out. The dismiss is deferred
    until the enter resolves, which the existing `handleAnimationEnd` safeguard
    and entering watchdog already route to `Leaving`.

- Fix the sheet replaying its exit animation after a drag-dismiss. ([#161](https://github.com/KealanAU/vyui/pull/161))

  Releasing a drag past the dismiss threshold drove the close twice: the MT
  release transition slid the panel off from where the finger left it, and
  Presence's `.ui-leaving` keyframe then ran the same close again — starting from
  the fully-open underlying value, so the panel snapped back up and played the
  exit a second time. The scrim did the same through `vyui-fade-out`, which keeps
  an explicit `from { opacity: 1 }`.

  The inline `animation: 'none'` the release worklet paints was meant to suppress
  that keyframe, but a class-driven animation outranks it on the Lynx style path.
  `SheetRoot` now carries a `dragClosing` flag, set by the release worklet before
  it emits the close, that drops `ui-leaving` from the panel and backdrop for that
  path — the MT transition owns the close and `@transitionend` still advances
  Presence to `Left`. Non-drag closes keep the keyframe unchanged.

- Make Slider's main-thread drag the only drag implementation, and fix it so it ([#159](https://github.com/KealanAU/vyui/pull/159))
  works. It previously filled its thumb registry and every `*MT` mirror with
  background-thread writes to `MainThreadRef.current`, which vue-lynx silently
  no-ops — the main thread saw an empty handle list and bailed out of
  `_paintActiveThumb` on every frame, while the commit read a stale array and
  landed as `next[0] ?? 0`.

  - `SliderRoot`'s min/max/step/disabled/values mirrors hop through
    `runOnMainThread` setter worklets, the shape `Sheet` uses.
  - `SliderImplMTS` resolves the thumb and range elements itself from the track via
    `querySelectorAll`, removing the BG→MT registration and its mount-time race.
    `SliderThumbImpl` no longer touches a `MainThreadRef` at all.
  - `update:modelValue` now fires per frame during the drag, so a value rendered
    next to the slider tracks the gesture instead of jumping on release.
    `valueCommit` stays once per gesture, compared against the value the gesture
    started from.
  - The thumb and the filled range are painted from the worklets by writing the
    same anchor offsets the background style computes, so neither thread's write
    can double-count the other's.
  - Values are re-sorted and the active thumb re-tracked every frame, and
    `minStepsBetweenThumbs` is enforced per frame rather than at commit time — a
    thumb stops at the limit instead of springing back on release.
  - Touch offsets are read from `touches[0].x`/`.y`, which are already relative to
    the bound element. Rebuilding them from `pageY - layoutchange.top` mixed
    viewport and page coordinates and drifted by the scroll offset.
  - Fixes the thumb sitting half its own width off-centre on right-anchored
    (inverted / RTL) sliders: the centring transform flips with the anchoring edge
    on the vertical axis but did not on the horizontal one.
  - Fixes the `md` thumb rendering 0×0 — `size-4.5` is not a Tailwind v3 utility,
    so it compiled to no CSS at all.

  **Removed:** the background drag implementation (`SliderImpl`), the
  `mainThreadDrag` prop, and keyboard stepping. The keyboard handlers never fired
  on Lynx native, which has no key events to bind.

- Fix the slider never moving on Lynx web. ([#161](https://github.com/KealanAU/vyui/pull/161))

  Two independent bails, both before the gesture emitted anything, which is why
  the value sat frozen at whatever it mounted with while native felt fine.

  The one that actually stranded it: `_dragStart` aborted when it could not
  resolve the thumb elements to paint. That lookup goes through the main-thread
  `querySelectorAll` wrapper, which calls a `__QuerySelectorAll` PAPI that Lynx
  web does not expose to the main-thread realm — `invoke` resolves there, this
  throws `ReferenceError`, and a `typeof` check on the wrapper method cannot see
  it coming. The query is now guarded, and no longer gates the drag: those
  elements only drive the main-thread paint, which is a latency optimisation over
  the background's own render, so losing them costs smoothness rather than
  correctness. The background still receives every value and renders the thumb
  from its own style.

  The second: the track's extent was the last piece of geometry sourced from a
  background `@layoutchange` pushed across with `runOnMainThread`. `_beginAt`
  already fetches `invoke('boundingClientRect')` once per gesture for the origin,
  and that response carries `width`/`height` too, so the extent comes from it as
  well. One measurement, one frame, no thread hop — and re-read per gesture,
  which also fixes a track that resized while its tab was hidden.

  `draggingMT` is wired up while here: `SliderImplMTS` was setting a local ref of
  its own, so the root's gate against echoing a live `update:modelValue` back
  into the main thread's values was never armed.

- Map Slider's touch and mouse gestures through one pointer coordinate frame. ([#161](https://github.com/KealanAU/vyui/pull/161))

  The touch path read `touches[0].x`/`.y`, which Lynx reports element-relative on
  native but does not provide on web at all — `createCrossThreadEvent` builds web
  touches from raw DOM `Touch` objects, which carry no `x`/`y`, so every offset
  came through as `NaN` and the thumb never moved on a touchscreen browser.

  Both paths now read `clientX`/`clientY`, the only pointer field Lynx reports on
  native and web alike, and share a single `_beginAt` that captures the track's
  origin from `invoke('boundingClientRect')` once per gesture and subtracts it.
  The origin still never comes from `layoutchange`, which reports page-relative
  coordinates that drift from the pointer's viewport frame by the scroll offset.

## 0.2.6

### Patch Changes

- Animate Collapsible/Accordion height on open/close by tweening a measured px height (Tray recipe); kept-mounted content morphs both directions. ([#156](https://github.com/KealanAU/vyui/pull/156))

- Scale the Sheet settle/dismiss duration by release velocity so a hard flick settles quicker while a slow release keeps the current feel. ([#156](https://github.com/KealanAU/vyui/pull/156))

- Cache the TabsIndicator list rect and re-measure it only on layout/orientation/dir changes, so a tab switch costs one `boundingClientRect` round-trip instead of two. ([#156](https://github.com/KealanAU/vyui/pull/156))

## 0.2.5

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

## 0.2.4

### Patch Changes

- KeyboardAware lift fixes: measure the margin against the LynxView viewport via `selectRoot()` instead of the screen (Explorer chrome no longer shortens the lift), flip `offset` to its documented extra-clearance meaning (it was pushing fields INTO the keyboard), let a wrapping Trigger's registration win over the input's self-registration, and register kit VyInput/VyTextarea's styled field (via an internal as-child Trigger) so the field's bottom chrome clears too. Also adds a library-level `useSafeArea` / `provideSafeAreaInsets` (elk-style normalization of Sparkling/Explorer global props with OS gating); Sheet panels now pad their docked edges by the container's safe-area insets, and `VyApp` provides these insets app-wide with a `safeArea` prop to tune them (`false` opts the whole app out with zeros; a partial `{ top, bottom }` overrides specific edges). Input/Textarea (core and kit) gain `avoidKeyboard` / `avoidKeyboardSpacing` passthroughs to Lynx's native `avoid-keyboard` root-view shift — a zero-JS alternative for simple forms. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Sheet handle now uses the mode-aware `bg-accented` token instead of a hardcoded translucent black, so the drag pill stays visible in dark mode. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Tabs indicator no longer animates growing in from zero width on mount / CSS reload — the transition now arms one tick after the first measurement, so only genuine tab switches slide. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Toast viewport now pads its docked edge by the container safe-area insets (via `useSafeArea`), so bottom toasts clear the iPhone home indicator and top toasts clear the notch — the same insets the Sheet panels already honor. ([#148](https://github.com/KealanAU/vyui/pull/148))

- Bump vue-lynx to 0.5.1 (widens peer range to `^0.4.2 || ^0.5.1`), with a local patch making the worklet-loader-mt registration scan comment-aware until upstream #287 ships ([#148](https://github.com/KealanAU/vyui/pull/148))

## 0.2.3

### Patch Changes

- `Button` forwards the Lynx tap event through its `tap` emit (`tap: [event: TouchEvent]`). Previously it emitted bare, so modifier-wrapped listeners merged in via `asChild` — like `ToastClose`'s `@tap.stop` over a button — crashed with `undefined.stopPropagation` on tap, leaving the toast close button broken. ([#137](https://github.com/KealanAU/vyui/pull/137))

- Dead-code audit: remove modules with zero consumers across core, kit, and every example app. ([#138](https://github.com/KealanAU/vyui/pull/138))

  **Breaking** (pre-1.0 patch by repo policy): removes never-used public exports — `withDefault`, `useScrollTo`, and the `components`/`originals`/`utilities` registry — from `@vyui/core`.

  - remove the unexported `shared/color/` module (channel/convert/gradient/parse/utils) — ported for ColorArea/ColorSlider primitives that were never built
  - remove unused `lynx-ui-common` ports: `selector.ts`, `version.ts`, `getEventDetail`, `mainThreadify`, `popoverUtils`, `convertToPx`
  - remove unused reka-ui ports: `useKbd`, `useGraceArea`, `useSelectionBehavior`, `useFormControl`, `isValidVNodeElement`, `withDefault`, `useScrollTo`, `Arrow.vue`, `countryList`
  - remove the hand-maintained `constants.ts` export registry (`components`/`originals`/`utilities` exports)
  - remove the 31 `*.story.vue` files (no story runner exists; `story/_*.vue` test fixtures are untouched)
  - drop the `vue-component-type-helpers` runtime dependency (only importer was `withDefault`)
  - `useId`: drop the Vue <3.5 fallback branch — every workspace pins Vue 3.5+

- Overlay cleanup ahead of the shared-core refactor. ([#143](https://github.com/KealanAU/vyui/pull/143))

  **Breaking** (pre-1.0 patch by repo policy): removes the dead `velocityThreshold` prop from `SheetRoot` (documented as unused/reserved — release logic uses the coast projection) and the consumerless `useSheetBehavior()` reactive wrapper, `progressFor`, `pickSnap`/`PickSnapOpts` (never adopted by Sheet; `pickRelease` is the one release spec), and their types from `@vyui/core`. The pure spec helpers (`pickRelease`, `directionAxis`, `viewportSnapsToPositions`, …) remain.

  - kit `VyModal`: wire the declared-but-dead `dismissible` prop — backdrop taps are now blocked when `false` and emit `close:prevent` (mirrors `VyPopover`)
  - sheet enter/exit keyframes now take their duration from the `duration` prop (inline `animation-duration` longhand) instead of a hardcoded 280ms, fixing the enter/settle desync for consumers like `VyTray` that pass `duration: 300`

- Export `combineGroupState` from Presence and use it in `DialogContent`, deleting the inlined copy that noted "(not exported)". ([#144](https://github.com/KealanAU/vyui/pull/144))

- Remove two unused shared exports that had no consumers. `useStateMachine` (`<Presence>` ships its own 1:1-ported state machine and never used it) is dropped from the public `@vyui/core` entry; `useForwardRef` (superseded by `useForwardExpose`) is dropped from the `@vyui/core/shared` entry. ([#140](https://github.com/KealanAU/vyui/pull/140))

- Require `vue-lynx@^0.4.2` and drop the local worklet-loader patch: upstream #190 now follows aliased and package worklet imports, with `includeWorkletPackages` for `node_modules` consumers. NPM consumers must set `pluginVueLynx({ includeWorkletPackages: ['@vyui/core', '@vyui/kit'] })` — documented in the installation guide. ([#142](https://github.com/KealanAU/vyui/pull/142))

## 0.2.2

### Patch Changes

- Cleanup pass: dead code removal, export gaps, and a color-parsing bug fix. ([#133](https://github.com/KealanAU/vyui/pull/133))

  - `@vyui/core`: export `ConfigProvider` from the public API — `useLocale`/`useDirection` depend on its context but had no supported way to provide it
  - `@vyui/core`: remove the disposable `useMtSmoke` diagnostic and unused `pick`/`omit` utils
  - `@vyui/core`: type `Radio.vue`'s click handler with `@lynx-js/types`' `MouseEvent`, not the DOM global
  - `@vyui/core`: fix `parseColor()`/`isValidColor()` — `hsv()` strings always threw despite being documented as a supported alias of `hsb()`
  - `@vyui/kit`: export `tray` from `@vyui/kit/theme` (missing, unlike every other component)
  - `@vyui/kit`: add exported `SelectEmits`/`ComboboxEmits`/`FeedListEmits` interfaces; `Combobox`'s `update:modelValue` is now typed instead of `any`

- Performance pass around tab switching and theme resolution. ([#134](https://github.com/KealanAU/vyui/pull/134))

  - `@vyui/core`: `Tabs` `unmountOnHide: false` now works — a panel mounts on first visit and stays mounted (hidden via `display: none` + `accessibility-elements-hidden`) after; previously the flag was threaded into context but never read, so panels always unmounted
  - `@vyui/core`: new `Tabs` `deferContent` prop — commits the content swap one macrotask after the trigger/indicator update so the tab bar responds instantly while a heavy panel mounts
  - `@vyui/core`: `TabsContent` accepts a per-panel `unmountOnHide` override (kit: `TabsItem.unmountOnHide`) — panels whose subtrees write styles from main-thread worklets (`setStyleProperty` / `animate(fill: 'forwards')`) can keep painting through the kept-alive `display: none` on device and should opt back into unmounting; kept-hidden panels also set `visibility: hidden` as defence
  - `@vyui/kit`: theme `tv` factories are memoized per app config (`defineThemeBuilder`, also inside `useStyledComponent`) instead of rebuilt per component instance — visible on Lynx's interpreter whenever a screenful of components mounts
  - `@vyui/kit`: `Tabs` forwards `deferContent`, resolves slot classes once per variant change instead of per trigger per render, and its triggers regain press feedback (`active:opacity-60` on the trigger itself — element opacity needs no CSS inheritance)
  - `@vyui/kit`: the Tailwind preset safelist now emits the EXACT classes the packaged themes generate for the configured color set (collected by walking the tv configs) instead of every `utility × color × shade × variant` combination — ~90% less generated CSS (857 KB → 84 KB in kit-demo), and the dead `data-[…]`/`ring-*` entries are gone

## 0.2.1

### Patch Changes

- 4ee6a7d: Make KeyboardAware work under vue-lynx: the root now receives keyboard height from the input's per-element `@keyboard` event (the global `keyboardstatuschanged` event never reaches the vue-lynx background runtime), inputs self-register with a surrounding `KeyboardAwareRoot` without needing a `KeyboardAwareTrigger` wrap, and `VyTray`'s `keyboardAware` now also covers the body (new `'lift' | 'scroll'` modes plus `bodyScroll` ui slot) instead of silently doing nothing without a footer slot.
- d4f9b1a: Update public package and documentation copy to describe Vy UI as Lynx-native UI primitives for Vue.
- 1637c40: Sortable rows no longer drag list chrome along with the finger. The kit theme now renders each row as a transparent shell (the element core transforms) around a new `itemContent` pill slot, so only the pill visibly moves — the old `border-b` divider look is gone. `SortableItem` flips a `ui-dragging` class (+ `data-state="dragging"`) on the lifted row, and `VYUI_UI_STATES` gains `dragging` so themes can restyle the lifted pill (default: stronger pill border via `group-ui-dragging:`).

## 0.2.0

### Minor Changes

- c344b72: Per-component subpath entries for tree-shakeable consumption. `@vyui/kit` now exposes every component as its own entry point (`@vyui/kit/button`, `@vyui/kit/tray`, …) with the same canonical `Vy*` bindings as the barrel, so migrating is a specifier swap. Because the vue-lynx main-thread worklet pipeline prunes by `sideEffects` globs over whatever is _reached_ (bare side-effect imports erase export usage), deep entries are the only way to ship less: importing `@vyui/kit/button` now reaches ~37 modules / 26 worklet registrations instead of the barrel's ~294 / 118.

  To make this work end-to-end, kit's build rewrites its own `@vyui/core` barrel imports to per-file deep specifiers (`@vyui/core/dist/components/….vue.js`), and `@vyui/core` exposes a `./dist/*.js` wildcard export to resolve them. Barrel imports (`import { VyButton } from '@vyui/kit'`) keep working unchanged — they just keep the everything-ships behavior.

  Also fixes `@vyui/kit`'s `sideEffects: false`, which let bundlers drop the package entirely from the vue-lynx main-thread worklet slice (entered via a bare side-effect import that uses no exports), so every transitively-imported `@vyui/core` worklet went unregistered and consumers crashed with `bind of undefined`. Kit now declares the same `sideEffects` globs as core.

- c344b72: Ship per-file, source-shaped ESM dist (Vite lib + Rollup `preserveModules`) instead of an rslib bundle.

  - Fixes the `__WEBPACK_EXTERNAL_MODULE_vue_lynx_* is not defined` main-thread crash for npm consumers of worklet-driven components (VyTray, VyDrawer, Slider, …): worklet modules now keep direct named `vue-lynx` imports the consumer's MT toolchain can follow.
  - Fixes the follow-on `cannot read property 'bind' of undefined` main-thread crash: each pre-compiled worklet module retains a `"main thread"` marker so the consumer's `worklet-loader-mt` extracts its `registerWorkletInternal` calls (with `_wkltId`s matching the background bundle) instead of dropping them. `@vyui/kit`'s `sideEffects` is widened to keep the transitive-core-worklet MT imports from being tree-shaken.
  - SFC `<style>` CSS is now published and auto-imported per module — the old bundle stubbed it, so consumers silently lost component styles.
  - Each SFC ships as a single `X.vue.js`; a `check-dist-shape` guard fails the build on any bundle fingerprint or a worklet module missing its marker.

## 0.1.2

### Patch Changes

- cbbbcbf: Ensure tray, drawer, and action sheet content renders above the sheet backdrop by default, and disable automatic capitalization and correction for kit email and password inputs.

## 0.1.1

### Patch Changes

- bb4d208: Add `VyTray` — a morphing, multi-view bottom sheet built on the core `Sheet` primitives. Views (`VyTrayView`) are measured per screen and the panel animates its height to fit whichever is showing ("grows into place"), with a back stack (`useTray().goBack` / `canGoBack`), a persistent `#footer` slot, and `floating` (detached card) vs `flush` (edge-anchored) variants.

  `@vyui/core` `SheetContent` gains a `fitContent` prop that sizes the panel to its natural content height instead of a `snapPoints × viewport` fraction — the drag/slide/backdrop physics reuse the measured height, so nothing else changes. This is the mode `VyTray` builds on.

- 31c2202: Add side-aware sheet and drawer motion. `SheetRoot` now accepts `side` for top, right, bottom, and left edge placement with matching slide animations and drag-to-dismiss physics. `VyDrawer` forwards its side to the core sheet, and sheet-backed kit components can opt into alternate edges.

  Edge placement and the enter/leave slide keyframes key off a `vyui-sheet__content--{side}` class rather than a `[data-side]` attribute selector, so they apply on Lynx native (which does not match attribute selectors in CSS) — restoring the open/close animation on device.

## 0.1.0

### Minor Changes

- 0610d70: Input/Textarea: surface the on-screen keyboard via a normalized `keyboard` event.

  - `Input` and `Textarea` (core) and `VyInput`/`VyTextarea` (kit) now emit `keyboard` with `{ visible: boolean, height: number, safeAreaBottom: number }`, normalized from Lynx's raw element payload `{ show, keyBoardHeight, safeAreaBottom }` (note the capital B in `keyBoardHeight`).
  - This is the reliable keyboard signal under vue-lynx: the global `GlobalEventEmitter` `keyboardstatuschanged` event is emitted natively but is not delivered to the vue-lynx background runtime, so the per-element event is what consumers (and keyboard-aware lifts) should use. See `docs/upstream/vue-lynx-keyboard.md`.
  - `VyTextarea` also now forwards `confirm`/`focus`/`blur` (previously only `update:modelValue`), matching `VyInput`.

### Patch Changes

- Fix unresolvable published types: shipped `.d.ts` imported the internal `@/*` path alias (unresolvable for consumers, which also degraded `@vyui/kit`'s re-exported types). Declaration emit now rewrites `@/*` to relative paths and adds explicit `.js` extensions, so types resolve under both `bundler` and `node16`/`nodenext`. Declared `@lynx-js/types` (optional peer) and `vue-component-type-helpers` (dependency), both used by public types. Added a packed-tarball smoke test and a `.d.ts` resolution check to the build.
- 0610d70: FeedList: honour a `noMoreData` prop so the end-of-list footer no longer shows while more pages remain.

  Previously the core `FeedList` rendered the `noMoreDataFooter` slot whenever `loadingMore` was false, so "no more items" appeared immediately even with pages still loadable (the kit `VyFeedList` already forwarded `noMoreData`, but core ignored it). The footer row now only renders while `loadingMore` (load-more spinner) or once `noMoreData` is `true` (end-of-list); otherwise no footer renders.

- baf0692: Fix drawer/sheet not opening fully: Lynx native drops the `dvh` unit, collapsing the panel to its content height. Size the sheet panel with `vh` and switch all viewport-height classes in the kit themes (drawer, modal, select, combobox, popover, dropdownMenu, island, actionSheet) from `dvh` to `vh`.
- 0610d70: Fix Sortable drag-to-reorder doing nothing on device/web:

  - **Registry was empty on the main thread.** Items registered their handle via a background-thread write to the `itemHandlesMT` `MainThreadRef`, which vue-lynx 0.4.0 silently drops. The lifted row never moved, siblings never shifted, and the drop saw `count === 0` so no reorder committed. Registration (element + index) now runs on the main thread, bound to `main-thread-binduiappear`, with MT teardown on unmount and `runOnMainThread` setter worklets for index/disabled sync.
  - **Long-press used MT `setTimeout`.** The main-thread worklet runtime does not expose `setTimeout`/`clearTimeout` (internal in `@lynx-js/types`), so the long-press timer threw and the row never lifted for any `longPressMs > 0`. The hold is now timed by polling `requestAnimationFrame` on the main thread.

  Public props/emits/slots unchanged.

- 300e34f: Keep sheet snap and drag geometry synchronized with dynamic viewport changes, and make kit swipers fill their measured container when no explicit item width is provided.

## 0.0.6

### Patch Changes

- FeedList: load-more on scroll-to-lower; pull-to-refresh removed. ([#74](https://github.com/KealanAU/vyui/pull/74))

  - Debounced / suppressed `loadMore`: it does not fire while a fetch is in flight (`v-model:loadingMore`), when `noMoreData` is set, or within `loadMoreDebounceMs`. Adds `loadMoreFooter` / `noMoreDataFooter` end-of-list slots.
  - Pull-to-refresh is intentionally not implemented. The reference upstream (lynx-ui) never uses the native `<refresh>` / `<refresh-header>` elements — they are legacy built-in UI classes the OSS Lynx runtime does not register (mounting one hard-crashes the create-UI pass). The PTR API (`enableRefresh`, `refreshing`, `refresh`, `refreshHeader` slot, `FeedListRefreshState`, `refreshSupported`) and the `isNativeRefreshSupported()` util are removed. PTR is deferred pending a gesture-runtime-based engine — see `FeedList/REFRESH-PHYSICS.md`.

- FeedList: pull-to-refresh, overscroll bounce, item-snap paging, and load-more. ([#76](https://github.com/KealanAU/vyui/pull/76))

  Pull-to-refresh is a custom rubber-band driven by `:main-thread-bindtouch*`
  worklets on a bare `<list>` (no native `<refresh>` wrapper). The pull only
  engages at the top edge — tracked via `:main-thread-bindscroll` /
  `scrolltoupper`, with the inner list's native `bounces` forced off — so normal
  scrolling and load-more are untouched. This replaces an earlier
  `@lynx-js/gesture-runtime` approach that couldn't fire (vue-lynx has no
  `:main-thread-gesture` binding); the touch path is supported today. The
  top-edge trick is device-only verifiable — see `FeedList/REFRESH-PHYSICS.md`.

  New:

  - `enableRefresh` + `v-model:refreshing`, `refreshThreshold` (default `64`),
    `refresh` / `refreshStateChange` emits, and a `refreshHeader` slot receiving
    `{ state, progress }`. Lifecycle is driven by `v-model:refreshing` (set
    `false` to end and spring the header closed). Exported type
    `FeedListRefreshState` (`'idle' | 'pulling' | 'releaseReady' | 'refreshing' | 'done'`).
  - `enableBounce` — rubber-band overscroll at both edges that springs back;
    works standalone or alongside refresh.
  - `itemSnap` — native `<list>` `item-snap` paging (`true` snaps each item to the
    top for full-screen paging, or pass a custom `{ factor, offset }`), plus a
    `snap` emit (`event.detail.position` = settled index).
  - Load-more on native `scrolltolower` (suppressed while `v-model:loadingMore` is
    set) with `loadMoreFooter` / `noMoreDataFooter` slots.

  Removed the legacy native `<refresh>` / `<refresh-header>` path (unregistered in
  the OSS Lynx runtime — mounting one crashes the create-UI pass) and the old
  `startRefresh` / `finishRefresh` / `refreshSupported` surface.

- Sortable, Draggable, SwipeAction: tighten main-thread gesture fidelity. ([#76](https://github.com/KealanAU/vyui/pull/76))

  Adds velocity-aware release (fling/momentum on drag end rather than
  position-only thresholds), axis locking so a committed gesture ignores the
  orthogonal axis, autoscroll when dragging near a Sortable list edge, and
  bounds clamping. Shared velocity/physics helpers were added to
  `shared/gesture/physics.ts`. Swiper (which shares the gesture layer) is
  unaffected.

- Fix two on-device gesture regressions: ([#76](https://github.com/KealanAU/vyui/pull/76))

  - **Sortable** long-press never started on touch: activation was timed via a MT→BG→`setTimeout`→MT round-trip whose final `runOnMainThread` hop was being dropped on-device, so drag-to-reorder never engaged. The long-press is now timed entirely on the main thread (worklet `setTimeout`), disarmed by a pre-activation move and cleared on release/unmount. Public props/emits/slots unchanged.
  - **SwipeAction** slow-drag appeared frozen after the first open/close: the `fill: 'forwards'` snap animation was never cancelled, so it outranked the next drag's inline `setStyleProperty('transform')` writes in the cascade. Touchstart now cancels the in-flight snap animation and re-asserts the current transform (mirrors Draggable's `resetAnimRef` guard).

- ScrollView: fix custom-bounce content being unscrollable / bounce items not ([#76](https://github.com/KealanAU/vyui/pull/76))
  appearing. When `enableBounces` is on, the component renders a clipping
  wrapper as its root, so consumer `style`/`class` (e.g. `height`) fall through
  to the wrapper — the inner `<scroll-view>` had no size and collapsed, so
  content couldn't scroll and the overscroll wrappers never revealed. The inner
  `<scroll-view>` now fills the wrapper (`width:100%; height:100%`). The
  non-bounce path is unchanged.

- ScrollView: add a main-thread custom bounce/overscroll system. ([#76](https://github.com/KealanAU/vyui/pull/76))

  New props mirroring lynx-ui's bounce surface: `enableBounces`,
  `singleSidedBounce` (`'upper' | 'lower' | 'both' | 'iOSBounces' | 'none'`),
  `alwaysBouncing`, `startBounceTriggerDistance` / `endBounceTriggerDistance`,
  `estimatedHeight` / `estimatedWidth`, and `enableRTL`. Adds `upperBounceItem` /
  `lowerBounceItem` slots for user-supplied overscroll indicators and an
  `onScrollToBounces` (`{ direction: 'upper' | 'lower' }`) event, with bounce
  gesture and animation driven on the main thread via the new `useBounce`
  composable. Preserves the `android-touch-slop` and BTS name-flush workarounds
  so events aren't dropped.

- SwipeAction: velocity-aware release. ([#74](https://github.com/KealanAU/vyui/pull/74))

  A quick flick now opens/commits even on a short drag, while a slow drag respects
  the position threshold. The in-flight snap animation is cancelled on touchstart
  so a follow-up drag isn't masked by a `fill: 'forwards'` animation. Public
  props/emits/slots are unchanged.

- Swiper: add autoplay, loop/circular, axis-lock, and offset clamping. ([#74](https://github.com/KealanAU/vyui/pull/74))

  New `SwiperRoot` props: `loop` (and its lynx-ui-style alias `circular`),
  `axisLock` (only consume predominantly-horizontal gestures, releasing vertical
  drags to the host scroll surface), `autoplay`, and `interval` (autoplay step
  time in ms). Looping wraps navigation, drag-release, and autoplay circularly
  (0 ↔ last) and disables end clamping; autoplay runs on the main thread and
  pauses during a drag, resuming on release.

- Swiper: seamless infinite loop + lynx-ui prop parity. ([#74](https://github.com/KealanAU/vyui/pull/74))

  `loop`/`circular` is now truly seamless — edge slides are cloned (a leading and
  trailing copy of the track) and the transform is rebased invisibly after a seam
  crossing, so motion continues across the first↔last boundary under both
  drag-release and autoplay instead of snap-rewinding. Programmatic `setIndex`
  jumps take the shortest path around the ring.

  New `SwiperRoot` props mirroring lynx-ui: `spaceBetween` (gap between items; the
  snap unit becomes `itemWidth + spaceBetween`), `mode`, `align`
  (`start`/`center`/`end` active-item placement, needs `containerWidth`),
  `containerWidth`, `offsetLimit` (explicit `[startLimit, endLimit]` rest clamp),
  and `rtl` (right-to-left layout flips drag/flick direction and the item margin).
  First-screen track layout (width + seam inset) is applied up front, matching
  lynx-ui's `useFirstScreenStyle` optimization.

- Add Sonner-style stacking to Toast. ([#73](https://github.com/KealanAU/vyui/pull/73))

  `@vyui/core`:

  - `ToastRoot` now binds its own `@layoutchange`, so the measured toast height feeds `heightBefore` automatically (previously nothing fed the resize observer, leaving the fan-out geometry at 0).
  - `ToastRoot` exposes two new slot values: `duration` (resolved auto-dismiss ms) and `progress` (`1 → 0` countdown that rides the dismiss timer's start/pause/restart lifecycle, frozen while expanded).
  - New `ToastSwipe` component — a main-thread swipe-to-dismiss layer (modeled on `SwipeAction`) that dismisses the surrounding `ToastRoot` when flung past a distance/velocity threshold. Exports `decideDismiss` for the unit-tested release policy.

  `@vyui/kit`: `VyToast` gains:

  - `stacked` — collapses toasts into an overlapping pile (front toast fully visible, the rest peeking scaled-down behind it) and fans them out under each other when expanded; tap a toast to toggle. Pair `stackFrom` (`top` | `bottom`, default `bottom`) with the `ToastViewport` position.
  - `swipe` (+ `swipeDirection`) — fling a toast sideways to dismiss it. The card renders on an inner `ToastSwipe` layer so the swipe transform never collides with the stacking transform.
  - `progress` — a thin countdown bar along the bottom edge that drains with the auto-dismiss timer (pauses while expanded, hidden when `duration: 0`).

  All off by default; a plain `VyToast` still renders as a single gapped-column card.

## 0.0.5

### Patch Changes

- Add AspectRatio — headless `@vyui/core` primitive (`AspectRatioRoot`, exported as both `AspectRatio` and `AspectRatioRoot`) that constrains its default slot to a given `ratio` (number, default `1`). ([#46](https://github.com/KealanAU/vyui/pull/46))

  Built for the Lynx render layer: it renders a single `<view>` using the native CSS `aspect-ratio` property (supported by Lynx's Starlight layout engine), with no absolutely-positioned padding wrapper.

- Add Avatar — Lynx-native `@vyui/core` primitives (`AvatarRoot` / `AvatarImage` / `AvatarFallback`). `AvatarRoot` provides image load-status context; `AvatarImage` renders a Lynx `<image>` and downgrades to the error state on `binderror` (`@error`); `AvatarFallback` shows when no image is loaded, with a `delayMs` flash-avoidance delay. ([#46](https://github.com/KealanAU/vyui/pull/46))

  Refactor `@vyui/kit`'s `VyAvatar` to compose the new core primitives for behaviour (load-status + fallback) while keeping its public `AvatarProps` API, initials derivation, chip overlay, theming, and `AvatarGroup` size/color inheritance unchanged.

- Fixes from #67, #68 and #70. ([#71](https://github.com/KealanAU/vyui/pull/71))

  `@vyui/core`:

  - Icon: reject `color` values that could inject SVG markup when resolving icon sources (#67).
  - Sheet: multi-snap drag now settles to the nearest snap point, with main-thread usage fixes across `SheetContentImpl`, `Draggable` and `useDragGesture` (#68).
  - Primitive: treat `image` as a self-closing leaf — Vue's empty-slot fragment/comment anchors were materialized as real children by vue-lynx, and a native `<image>` with any child fails to render (native-only breakage; lynx-web tolerated it) (#70).

  `@vyui/kit`:

  - Forward icon classes/props through ActionSheet, Alert, Button, Tabs, Toast, ToggleGroup and DropdownMenu items, and fix Drawer/theme slot classes so drawer animations work again (#70).

## 0.0.4

### Patch Changes

- Add NumberField — headless `@vyui/core` primitive (`NumberFieldRoot` / `NumberFieldInput` / `NumberFieldIncrement` / `NumberFieldDecrement`) with min/max/step, clamp/snap and decimal-precision handling, plus a styled `VyNumberField` in `@vyui/kit`. ([#44](https://github.com/KealanAU/vyui/pull/44))

  Fix `Input` not reflecting programmatic value changes on native Lynx — controlled updates that don't originate from typing are now pushed through the imperative `setValue` path (the reactive `value` binding is initial-only on a native `<input>`). This makes NumberField's increment/decrement buttons update the field on iOS/Android, not just web.

  Avatar now falls back to initials/icon when its image fails to load (wires the Lynx `<image>` `binderror` event).

  Document `VyCombobox` as the autocomplete pattern — `searchable` filtering over a fixed set covers the use case, so there is no separate Autocomplete component.

  Widen `@vyui/kit`'s `@vyui/core` peer-dependency range from `^` to `~` so it tracks `0.0.x` core patches without forcing a major bump.
