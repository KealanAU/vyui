---
title: "@vyui/core v0.2.7"
description: "Drive every gesture surface from mouse events on Lynx web, and fix Sortable's"
date: "2026-07-25"
package: core
version: "v0.2.7"
changelogOrder: 2007
---

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
  web-core's main-thread `lynx` object has no `querySelector`, so on web every
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
  object has no `querySelector`, so the first call raised a `TypeError` and took
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
  well. One measurement, one frame, no thread hop, and re-read per gesture,
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
