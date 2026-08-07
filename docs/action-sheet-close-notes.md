# ActionSheet close/animation bugs — investigation notes (2026-07-25)

Context: on `fix/presence-web-wedge` the ActionSheet "flashes up and then plays
back" on close. One cause was found and fixed (see §0); the user reports the
surface is still buggy. These are the remaining hypotheses, ranked, for a
round-two pass with fresh context. **None below are verified on device** — the
user does all visual checks.

Files that matter:

- `packages/core/src/components/Sheet/SheetContentImpl.vue` (panel, MT drag worklets, keyframes)
- `packages/core/src/components/Sheet/SheetBackdropImpl.vue` (scrim)
- `packages/core/src/components/Presence/usePresence.ts` (state machine)
- `packages/core/src/components/Presence/presence.css` (shared fade keyframes)
- `packages/kit/src/components/ActionSheet.vue`, `packages/kit/src/theme/actionSheet.ts`

---

## 0. FIXED — close racing the enter animation

`handleDismiss` cut `Entering` → `Leaving` immediately. The exit keyframe omits
its `from` step, so it starts from the element's *underlying* transform —
`.vyui-sheet__content.ui-leaving { transform: translate(0,0) }`, i.e. fully
open. Panel jumped from mid-slide to open, then played the exit from there.

Fixed in `usePresence.ts` `handleDismiss`: mid-enter dismisses are deferred
until the enter resolves; `handleAnimationEnd`'s existing safeguard and the
entering watchdog route it to `Leaving`. Test:
`Presence.test.ts` → "a close that races the enter animation waits for it".

---

## 0b. FIXED — drag-dismiss drove the close twice

User observation that cracked it: "if I drag it down slowly it plays kinda
well, then at the end it plays the animation again."

On release, `_dragEnd` starts the MT inline transition off-screen AND emits the
close, which puts `.ui-leaving` on the panel, so the keyframe ran the same
close a second time, from the fully-open underlying value. The inline
`animation: 'none'` pin was supposed to stop that, but a class-driven keyframe
outranks inline on the Lynx style path. (Inline `transform` clearly *does* work,
or the drag wouldn't paint at all, so the failure is specific to `animation`.)

Fixed by removing the class instead of fighting it: `ctx.dragClosing` on the
sheet root context, set in `_emitClose` before `setOpen(false)`, makes the panel
and backdrop pass `transition: false` to `presenceClassVariants` so no
`ui-leaving` is emitted. `@transitionend` still advances Presence to `Left`.
Reset in `SheetRoot`'s `watch(open)` on reopen.

This subsumes §1 below (the scrim had the same double-drive).

## 1. FIXED via §0b — backdrop scrim flashed back to full dim on a drag-dismiss

`_settleTo` (`SheetContentImpl.vue`) pins the **panel** with inline
`animation: 'none'` so the `.ui-leaving` slide-out keyframe can't hijack it —
but it never does the same for the **backdrop**. It only writes `transition` +
`opacity` via `_setBackdropStyle`.

Meanwhile `vyui-fade-out` (`presence.css`) has an **explicit `from { opacity: 1 }`**,
unlike the slide-out keyframes which deliberately omit `from`. A class-driven
keyframe outranks inline styles, so on drag-dismiss:

- finger has the scrim at, say, `opacity: 0.3` (inline, from `_dragMove`)
- `_emitClose` → BG → `.ui-leaving` on the backdrop → `vyui-fade-out` starts at
  **1.0** → the dim **jumps back to full** and fades out over 280ms

Same asymmetry appears on any close: `.ui-open{opacity:1}` drops and the base
`.vyui-sheet__backdrop{opacity:0}` is underneath, so a late-starting keyframe
gives a one-frame blackout-to-nothing.

Fixed by §0b (the class is gone, so the keyframe never applies). If a scrim
flash ever shows up on a NON-drag close, the explicit `from { opacity: 1 }` in
the shared `vyui-fade-out` is still the thing to look at.

## 2. ActionSheet panel is a full-viewport-height surface (high confidence, may be by design)

`ActionSheet.vue` does not pass `fit-content` to `<SheetContent>`, and passes no
`snapPoints`, so `maxSnap === 1` and `panelStyle` emits inline **`height: 100vh`**
(`SheetContentImpl.vue` `panelStyle`). The kit theme only sets
`max-h-[100vh]` (a max — it does not shrink), `flex flex-col`, and
`list: 'flex-1'` which *grows*. Net: the panel is the full screen painted
`bg-default`, rows at the top.

Knock-on effects even if the visual is somehow fine:

- `panelExtentPx` (measured via `@layoutchange`) = viewport height, so the
  drag-dismiss threshold `mostClosed + extentPx * 0.4` is **40% of the whole
  screen** — dragging an action sheet down "far enough" is nearly impossible.
- `_translateClosed()` translates by 100% of a full-screen panel, so the exit
  travel is a screenful regardless of how tall the sheet looks.
- backdrop drag-fade progress (`1 - pos / extentPx`) barely moves.

Compare `packages/kit/src/components/Tray.vue`, which *does* pass `fit-content`.
**First thing to check visually.** If the ActionSheet should hug its rows, pass
`fit-content` and drop `max-h-[100vh]`/`flex-1` accordingly.

## 3. Child transitions bubble into the panel's Presence handlers (web; medium)

The kit theme gives every row `item: '... transition-colors active:bg-elevated'`.
On the Lynx **web** runtime DOM events bubble, so a row's press-feedback
`transitionstart`/`transitionend` reach the panel's
`@transitionstart`/`@transitionend` → `handleTransitionStart/End`.

`isTransitionAnimating` is a **boolean, not a counter**. Interleaved child
transitions (tap a row → it closes → rows still transitioning) can leave it
stuck `true`, so `handleAnimationEnd` refuses to advance `Leaving → Left` and
the sheet only resolves via the 3s `MAX_STUCK_MS` cap — an invisible
full-screen backdrop eating taps for 3 seconds.

**Fix candidates:** filter the handlers by event target (only fire for the
Presence element itself), or make the two flags counters. Target-filtering is
the real fix — the `MAX_STUCK_MS` watchdog exists because of exactly this
bubbling and is a band-aid over it.

## 4. Double rAF in `_settleTo` widens the unpinned window on native (medium)

`_settleTo` now does `rAF(rAF(apply))` — added because the web runtime fires a
single rAF *before* the frame's style commit. On native this holds the panel
frozen at the release position for **two** frames before the eased move starts,
and widens the window in which BG's `.ui-leaving` class patch can land between
the pin and `apply()`.

If a BG patch ever re-writes the element's `style` (see §5), that window is when
the inline `animation: 'none'` pin is lost and the leave keyframe snaps the
panel to fully open. Consider gating the second hop to the web runtime, or
proving native is fine with one.

Note: `_slideOffFromCurrent` (non-drag close from an intermediate snap) still
leans on inline `animation: 'none'` and so has the same weakness as §0b, but it
can't set `dragClosing` without a `runOnBackground` hop that would race the
class patch. It only bites with multiple snap points, so ActionSheet
(single snap, `posRef` always 0, worklet bails) is unaffected.

## 5. Do BG style patches wipe MT inline styles here? (unknown — needs proving)

Memory note `sheet-ghost-close-hard-cap-only` records that MT inline-style
animations die under BG style wipes while class/keyframe ones survive. The whole
drag-close design depends on inline `animation: 'none'` surviving the BG class
patch that adds `.ui-leaving`.

Reasoning suggests it survives: `panelStyle` is a `computed` whose deps
(`safeArea`, `ctx.duration`, `maxSnap`, `axis`, `fitContent`) don't change on
close, so Vue sees the same object identity and skips `patchStyle` on a
class-only update. **But this was never verified on device.** If it *does*
re-patch, that alone reproduces the original "flash up, then play back" on every
drag-dismiss. Worth a one-off device trace before trusting the pin.

## 6. No busy-tap guard on ActionSheet (low, but cheap)

`DialogTrigger`/`DialogClose`/`AlertDialogAction` all gate on `resolveBusyState`
so a tap mid-animation is swallowed. `ActionSheet.vue`'s `handleSelect` /
`handleCancel`, and `SheetBackdrop`'s `onTap`, do not. With §0 fixed a mid-enter
tap is now deferred rather than dropped, but repeated taps during `Leaving` can
still churn `ctx.open`. Cheapest hardening: gate the sheet's close paths on
`resolveBusyState` like the dialogs do.

## 7. Panel and backdrop are two independent Presence machines (low)

`SheetContent` and `SheetBackdrop` each wrap their own `<Presence>`, each with
its own watchdog and its own animation events. They can resolve at different
times, and either can wedge alone. If a bug shows the scrim outliving the panel
(or vice versa), this is why. A shared `usePresenceGroup` would sync them —
`usePresenceGroup.ts` already exists and Dialog uses `groupState`.

---

## Suggested order for round two

1. Look at the ActionSheet on device and settle §2 (is it full-screen?).
2. §3 — target-filter the Presence animation handlers.
3. §5 — trace whether the inline pin survives, then decide §4.
4. §6 — busy-tap guard, if repeated taps still churn `open`.
