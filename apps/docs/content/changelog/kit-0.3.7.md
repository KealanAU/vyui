---
title: "@vyui/kit v0.3.7"
description: "Drive every gesture surface from mouse events on Lynx web, and fix Sortable's"
date: "2026-07-25"
package: kit
version: "v0.3.7"
changelogOrder: 3007
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

- Repo-wide over-engineering cleanup. Migrate all 38 `@vyui/kit` components off the internal `defineThemeBuilder` helper onto the existing `useStyledComponent` composable and delete the helper. Remove dead code from `@vyui/core` (the `useWarning` no-op, and the unused `areEqual`/`findValuesBetween`/`mtsLog`/`get`/`noop` utils) and simplify `handleAndDispatchCustomEvent`. In `@vyui/cli`, drop the fuzzy "did you mean" suggestion from the unknown-component error (which already lists every available component) and simplify dependency resolution. No public component API changes. ([#158](https://github.com/KealanAU/vyui/pull/158))

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

- Fix the default (`md`) Slider thumb rendering 0×0. Its size was `size-4.5`, and ([#159](https://github.com/KealanAU/vyui/pull/159))
  Tailwind v3's spacing scale has no 4.5 step, so the class compiled to no CSS —
  safelisted, no build warning. It is now `size-[18px]`, and the preset test suite
  fails on any theme class using a fractional spacing step v3 cannot generate.
- Updated dependencies [[`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80), [`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80), [`f9f0946`](https://github.com/KealanAU/vyui/commit/f9f0946c902f7718f5f3e1dd3ec78d3c33470c5d), [`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80), [`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80), [`01415de`](https://github.com/KealanAU/vyui/commit/01415de18898a3a9ac76234d3a881ab87e2d9bb7), [`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80), [`949edd3`](https://github.com/KealanAU/vyui/commit/949edd34636c939604040db3d821807617bd6d80)]:
  - @vyui/core@0.2.7
