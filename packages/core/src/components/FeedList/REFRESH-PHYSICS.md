<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0. -->

# FeedList custom rubber-band pull-to-refresh — feasibility findings

**Verdict: NOT feasible with what vyui ships today.** Porting lynx-ui's
main-thread rubber-band refresh/bounce engine requires gesture-arbitration
primitives (`@lynx-js/gesture-runtime`) and main-thread selector helpers
(`@lynx-js/lynx-ui-common`) that vyui does not depend on and should not add
casually. No shippable code change was made; FeedList continues to delegate
the pull gesture + bounce physics to the native `<refresh>` element, with the
existing JS refresh *lifecycle* state machine layered on top.

---

## What lynx-ui's engine actually depends on

Sources inspected:

- `lynx-ui/packages/lynx-ui-feed-list/src/index.tsx` (402 LOC)
- `lynx-ui/packages/lynx-ui-feed-list/src/hooks/useRefresh.ts` (1259 LOC)
- `lynx-ui/packages/lynx-ui-feed-list/package.json`

The engine is `useRefreshAndBounce` in `hooks/useRefresh.ts`. Its hard imports:

```ts
import { NativeGesture, useGesture } from '@lynx-js/gesture-runtime'
import type { GestureChangeEvent, StateManager } from '@lynx-js/gesture-runtime'
import { log, mtsLog, mtsNativeLynxSDKVersionLessThan, selectorMT }
  from '@lynx-js/lynx-ui-common'
```

`package.json` declares `@lynx-js/gesture-runtime` and `@lynx-js/lynx-ui-common`
(workspace) as hard `dependencies`.

### The load-bearing capability: gesture arbitration

The whole mechanism hangs on one thing a native `<list>`/`<scroll-view>`
will NOT give up on its own — its scroll gesture. The engine:

1. Creates a gesture object: `const g = useGesture(NativeGesture)`.
2. Attaches it to the list via the JSX prop `main-thread:gesture={g}`
   (`index.tsx:374`).
3. In the gesture's main-thread `onBegin` / `onUpdate` / `onEnd` callbacks it
   receives a `StateManager` and calls:
   - `gestureManager.consumeGesture(true|false)` (SDK < 3.3), and/or
   - `gestureManager.interceptGesture(true|false)` (SDK >= 3.3)
   to **steal the vertical scroll gesture from the native list** the moment the
   user pulls down at the top edge (`useRefresh.ts:1117-1244`).

Only after intercepting can it drive its own rubber-band by writing
`transform: translateY(...)` directly onto the container + header wrappers via
`selectorMT(containerID)?.setStyleProperty('transform', ...)`
(`bouncingSetStyle`, `useRefresh.ts:476-574`), running rAF spring/fling
integration on the main thread (`bouncingBack`, `bouncingBackEntrance`,
`handleBounceEventInFling`).

It also relies on:
- `selectorMT(id)` to mutate sibling wrapper elements by id from a worklet
  (the header wrapper, bounce wrappers) — vyui's MT refs only address the one
  element a `:main-thread-ref` is bound to.
- `mtsNativeLynxSDKVersionLessThan('3.3')` to branch consume vs. intercept.
- `SystemInfo.platform` / `SystemInfo.pixelRatio` (globals, available) for
  per-platform thresholds.
- Upper/lower edge detection via `binduiappear`/`binduidisappear` on 1ppx
  sentinel `list-item`s (`onUpperExposure`/`onLowerExposure`) — portable, but
  only useful once you can intercept the gesture.

## What's missing in vyui

| Need | lynx-ui source | vyui status |
| --- | --- | --- |
| `useGesture(NativeGesture)` + `main-thread:gesture` prop | `@lynx-js/gesture-runtime` | **Not a dependency. Not installed. Not in lockfile.** |
| `StateManager.consumeGesture` / `interceptGesture` | `@lynx-js/gesture-runtime` | **None.** No gesture-arbitration primitive exists anywhere in `packages/core/src`. |
| `selectorMT(id)` MT element lookup by id | `@lynx-js/lynx-ui-common` | **None.** vyui addresses MT elements only via `useMainThreadRef` bound to one element. |
| `mtsNativeLynxSDKVersionLessThan` | `@lynx-js/lynx-ui-common` | **None.** |

vyui's `packages/core/package.json` lists only `@lynx-js/react`,
`@lynx-js/types`, `@lynx-js/testing-environment` (the last two dev-only).
`grep` for `gesture-runtime`, `useGesture`, `NativeGesture`, `consumeGesture`,
`interceptGesture`, `main-thread:gesture` across `packages/core/src` returns
nothing.

## Why the existing vyui MT pattern can't substitute

vyui has the *physics* already (`shared/gesture/physics.ts`:
`rubberEffect`, `applyBounce`, `calcVelocity`, `pruneQueue`, `easeOutCubic`,
`projectMomentum` — all unit-tested) and the MT-worklet plumbing pattern
(`shared/gesture/useDragGesture.ts`: prop→MT-ref sync, rAF animation, BG↔MT
hops). So the math and the worklet pipeline are not the blocker.

The blocker is **gesture ownership**. Every vyui component that drives a
custom MT transform from `bindtouch*` worklets (Swiper, Sheet, Draggable,
Slider, SwipeAction) binds those handlers to a **non-scrolling `<view>`**.
None binds touch worklets to a scroll-owning `<list>`/`<scroll-view>`
(verified: `grep main-thread:bindtouch packages/core/src/**/*.vue` finds no
`<list>` host). A native `<list>` consumes its own vertical scroll gesture;
plain `bindtouchmove` worklets fire alongside scrolling but cannot suppress it
or redirect the surface, so a hand-rolled rubber-band on the list itself would
fight the native scroller (jitter / both moving). Stealing the gesture is
precisely what `consumeGesture`/`interceptGesture` exist for, and that is the
piece vyui lacks.

The documented `<refresh-header>`-as-sibling-of-`<list>` constraint
(FeedList.vue header comment) further means the *native* `<refresh>` element is
currently the thing that legitimately owns the pull gesture — replacing it
means taking over arbitration, i.e. the gesture-runtime path.

## Recommended path

Two viable options, in preference order:

1. **Keep delegating to native `<refresh>` (current state — recommended).**
   The existing JS refresh state machine + `headeroffset`/`dropdown` →
   `pulling`/`releaseReady` mapping already lets consumers render custom
   pull / release / loading / done affordances in the `refreshHeader` slot,
   while the native element provides correct, platform-tuned bounce physics
   and gesture ownership for free. This is the lowest-risk option and needs no
   new dependency. No code change required.

2. **Add the gesture dependency and port the engine.** If physics-driven,
   fully custom-rendered pull (e.g. an interruptible spring whose curve vyui
   controls, decoupled from the native `<refresh>` look) is genuinely wanted:
   - Add `@lynx-js/gesture-runtime` to `packages/core` `dependencies` (and a
     matching peer range), confirm it's compatible with the pinned
     `@lynx-js/react ^0.116.5` / `vue-lynx ^0.4.0`, and confirm `vue-lynx`'s
     template compiler accepts a `:main-thread-gesture` (or equivalent) binding
     — lynx-ui uses React's `main-thread:gesture` JSX prop; the vue-lynx
     equivalent must be verified to exist and register on a device (cannot be
     checked under vitest — see issue #6).
   - Replace `selectorMT(id)` usage: either add a small MT id-selector helper,
     or restructure so every element the engine transforms carries its own
     `:main-thread-ref` (header wrapper, list container).
   - Reuse `shared/gesture/physics.ts` for `rubberEffect` and inline the
     spring/fling integration as MT worklets in the SFC (cross-file worklets
     don't register — see project notes), mirroring the `useDragGesture.ts`
     conventions (helpers defined above callers; BG→MT sync via
     `runOnMainThread`; BG writes to `.current` dropped).
   - Preserve the existing `FeedListRefreshState` machine and the
     `<refresh-header>`-sibling-of-`<list>` layout constraint; the custom
     engine would drive `translateY` on the wrappers while the state machine
     stays the public lifecycle contract.

   This is a substantial, device-verification-gated effort and should be its
   own tracked task with the dependency addition reviewed explicitly, not
   slipped into a refactor.

## Bottom line

No shippable code change here. The feature is blocked on
`@lynx-js/gesture-runtime` (gesture arbitration) and `@lynx-js/lynx-ui-common`
(`selectorMT`, version gating). Until those are deliberately added and the
vue-lynx gesture-binding path is device-verified, FeedList should continue to
delegate pull-to-refresh to the native `<refresh>` element with the existing
JS lifecycle state machine on top. No changeset added (no code change).

---

# Addendum — `<refresh>` not registered on LynxExplorer (create-UI crash)

**Symptom.** Opening a demo tab with a `<FeedList enable-refresh>` hard-crashed
the Lynx runtime (LynxExplorer, SDK 1.4.0) at create-UI time:

```
LynxCreateUIException: refresh ui not found when create UI
```

i.e. the native `<refresh>` element FeedList renders for native PTR is **not
registered** in this runtime build.

## Why `<refresh>` is missing

`<refresh>` / `<refresh-header>` are **legacy built-in UI classes** from older
internal Lynx native runtimes (Lark / TT shells), where the host app registered
`refresh` and `refresh-header` UI classes into the element factory. The
open-source **LynxExplorer** build — and the engine that `@lynx-js/react` /
`vue-lynx` target — does **not** register these elements. When the element
factory is asked to create a `refresh` UI it has no class for, it throws
`LynxCreateUIException: refresh ui not found when create UI` during the
create-UI pass. The crash happens on mount, before any JS event handler runs,
so it cannot be caught at the component level — it has to be avoided by **not
emitting the element at all**.

Cross-check with lynx-ui (`lynx-ui/packages/lynx-ui-feed-list/`): lynx-ui's
feed-list **never uses a native `<refresh>` element**. `grep` for `<refresh`,
`refresh-view`, `RefreshView` across all of `lynx-ui/packages/` returns
nothing. Its `useRefreshAndBounce` builds the *entire* pull-to-refresh
experience on a plain `<list>` using `@lynx-js/gesture-runtime` gesture
arbitration (`consumeGesture` / `interceptGesture`) + MT `translateY` transforms
(see the original findings above). It gates only on `enableRefresh` /
`enableBounce` options and on SDK version for the consume-vs-intercept branch —
**never** on the existence of a native refresh element, because it doesn't rely
on one. This is strong corroboration that the native `<refresh>` element is not
a portable, registered element in the modern OSS engine; lynx-ui deliberately
avoids it.

## Is native PTR testable on this runtime?

**No.** On stock LynxExplorer SDK 1.4.0 the `<refresh>` element is unavailable,
so native pull-to-refresh cannot be exercised there at all — and merely mounting
it crashes. Native PTR only works on a host that registers the legacy refresh
UI (a custom embedder). There is also **no runtime JS API to query the element
registry**, so "is `<refresh>` registered" cannot be feature-detected directly;
it can only be inferred from an explicit host signal or assumed unsafe.

## Fix shipped — gate the `<refresh>` render

FeedList now renders the `<refresh>` wrapper only when **both** `enableRefresh`
is set **and** the runtime is known to support the element. Otherwise it renders
the bare virtualized `<list>` with PTR disabled, so the component mounts cleanly
with `enable-refresh` set on a runtime lacking `<refresh>`.

- New helper `isNativeRefreshSupported()` (`shared/utils/version.ts`):
  conservative and crash-safe — returns `false` when `SystemInfo` is absent
  (jsdom / OSS engine) or gives no positive signal; returns `true` only when the
  host advertises `SystemInfo.supportRefreshUI === true`. There's no element
  registry API, so "unsupported" is the safe default.
- New FeedList prop `refreshSupported?: boolean` (escape hatch):
  `undefined` (default) → auto-detect; `true` → force-render `<refresh>` (only
  for hosts that genuinely register it); `false` → never render it.
- Template gate `usePtrWrapper = computed(() => enableRefresh && refreshSupported)`
  replaces the old `v-else-if="enableRefresh"` on `<refresh>`. The bare-list
  `v-else` branch handles the unsupported case.
- A `__DEV__` warning fires when `enableRefresh` is set but the runtime lacks
  the element, so the silent PTR no-op is discoverable.

Everything else is preserved: the `FeedListRefreshState` machine, the
`startrefresh` double-fire guard, `headeroffset`/`dropdown` → `pulling`/
`releaseReady` mapping, waterfall/flow layout, loadMore debounce, and the
documented `<refresh-header>`-as-sibling-of-`<list>` constraint. Public API is
unchanged (`:items`, `:item-key`, `enable-refresh`, `enable-load-more`,
`v-model:refreshing`, `@refresh`, `#item`); `refreshSupported` is additive and
defaults safe. `defineExpose` now also surfaces `refreshSupported` for
consumers that want to render their own fallback affordance.

## Re-test steps (simulator)

1. Build the kit/native demo and open it in LynxExplorer (SDK 1.4.0).
2. Open the FeedList / Gestures demo tab with `enable-refresh` set. It must now
   **mount without crashing** — the bare `<list>` renders, scrolling and
   load-more work, and pull-to-refresh is inert (no native bounce header).
3. Confirm the `__DEV__` console warning appears once explaining PTR is disabled
   because `<refresh>` isn't registered.
4. To verify native PTR positively, run on a host that registers the legacy
   refresh UI and either set `SystemInfo.supportRefreshUI = true` (auto-detect)
   or pass `:refresh-supported="true"` on the FeedList; the `<refresh>` wrapper
   then mounts and the existing state machine drives pull / release / loading /
   done as before.
