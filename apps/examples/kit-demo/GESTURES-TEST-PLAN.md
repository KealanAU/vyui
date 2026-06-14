# Gestures / Scroll — iOS Simulator Test Plan

Run the kit-demo on the **iOS simulator** and walk through the checklist below.
Covers all 6 reported issues. Each item lists the steps, expected behavior, and
any runtime limitations.

How to run:

```bash
pnpm --filter kit-demo dev
```

Open the demo in the Lynx iOS simulator and use the bottom tab bar to navigate.

Tab bar (left → right): **Theme · Form · View · Gestures · Feed · Scroll · Island · Modal**

---

## 1. Tab icon renders (was `icon-park-outline:gesture`, invalid)

- [ ] Look at the tab bar. The **Gestures** tab shows a hand icon
      (`icon-park-outline:hand-up`), not a blank/missing glyph.
- [ ] The new **Feed** tab shows a list icon (`icon-park-outline:list-two`).
- [ ] The new **Scroll** tab shows a swipe icon (`icon-park-outline:swipe`).

**Expected:** all three icons render. The previous `icon-park-outline:gesture`
name did not exist in the icon set, so it rendered nothing.

**Runtime notes:** none.

---

## 2. FeedList refresh crash-safe (no `LynxCreateUIException`)

- [ ] Open the **Feed** tab.
- [ ] Confirm the demo loads without crashing. On runtimes lacking the native
      `<refresh>` element (e.g. iOS sdk 1.4.0) the list must still render and
      scroll — it must NOT throw `LynxCreateUIException: refresh ui not found`.
- [ ] Scroll the list up and down. It scrolls smoothly within its panel.

**Expected:** the feed appears with 20 items and is scrollable; no crash on
mount even when `enable-refresh` is set on a runtime without `<refresh>`.

**Runtime notes:** the on-screen amber note states native pull-to-refresh depends
on runtime `<refresh>` support. If the runtime lacks it, the pull-down gesture is
inert but load-more and scrolling still work. (Crash-safety is owned by the
FeedList worker in `packages/core`; this plan only verifies the public-API usage
does not regress.)

---

## 3. Sortable — plain tap must NOT reorder

- [ ] Open the **Gestures** tab → **Sortable** card (Design · Engineering ·
      Product · Research · Support).
- [ ] **Tap** a row once (quick press + release, no drag). The order line under
      the heading must be unchanged.
- [ ] **Long-press + drag** a row to a new position and release. The order line
      updates to reflect the committed order.

**Expected:** a tap is a no-op; only a deliberate drag reorders. Edge autoscroll
and clamping keep the dragged item inside the list bounds.

**Runtime notes:** none.

---

## 4. FeedList has its own tab (pull-to-refresh + load-more)

- [ ] Confirm **Feed** is its own top-level tab (no longer crammed into Gestures).
- [ ] The list region is tall (~440px) so the gestures are actually exercisable.
- [ ] **Pull down** from the top past the threshold and release. If the runtime
      supports `<refresh>`, a "Fresh item" is prepended after ~0.9s and the
      header rebounds.
- [ ] **Scroll to the bottom.** 10 more items append (load-more), debounced so a
      single fling triggers it once.
- [ ] Tap **Reset feed** to return to the initial 20 items.

**Expected:** refresh prepends one fresh item; load-more appends batches of 10;
reset restores the original 20.

**Runtime notes:** pull-to-refresh requires runtime `<refresh>` support (see #2).
Load-more and scrolling work regardless.

---

## 5. ScrollView bounce has its own tab

- [ ] Confirm **Scroll** is its own top-level tab.
- [ ] The scroll region is tall (~460px) with 24 rows so content actually scrolls.
- [ ] **Overscroll past the top edge:** the "↓ release to bounce" indicator is
      revealed; "Last bounce" updates (e.g. `upper`).
- [ ] **Overscroll past the bottom edge:** the "↑ release to bounce" indicator is
      revealed; "Last bounce" updates (e.g. `lower`).
- [ ] On release, the content rebounds to its resting position.

**Expected:** bounce indicators appear at both edges; the `scroll-to-bounces`
event fires and updates the "Last bounce" readout.

**Runtime notes:** the bounce is a custom main-thread implementation (core
ScrollView), independent of native bounce. The section uses a bounded,
self-contained scroll region to avoid nesting two vertical scrollers inside the
demo's outer `<scroll-view>` (a known Lynx gesture-routing gotcha).

---

## 6. SwipeAction — flick vs slow-drag

- [ ] Open the **Gestures** tab → **SwipeAction** card (3 mail rows).
- [ ] **Quick flick** a row to the left (short, fast drag). The row commits open
      (or to its action), even though the drag distance is short — velocity-aware
      release.
- [ ] **Slow drag** a row left a small amount and release below the threshold.
      The row snaps back closed (position threshold respected).
- [ ] **Slow drag** past the threshold and release. The row stays open, revealing
      the red **Delete** action.
- [ ] Tap **Delete** on an open row. The row is removed and the action closes.

**Expected:** a fast flick commits on short distance; a slow drag respects the
position threshold; Delete removes the row.

**Runtime notes:** none.

---

## Cross-cutting notes

- **Nested vertical scroll:** Feed (native `<list>`) and Scroll (bounce
  `<scroll-view>`) live in their own tabs with bounded heights so they do not
  fight the demo's outer vertical `<scroll-view>`. If scrolling ever feels
  "stuck", confirm you are scrolling inside the bounded panel.
- **Runtime-limited:** native pull-to-refresh (`<refresh>`) availability varies by
  Lynx runtime/SDK version. The demo and this plan treat its absence as expected,
  not a failure.
