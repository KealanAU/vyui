/**
 * useAnimate — main-thread enter/leave animation helpers backed by the Web
 * Animations API (`element.animate()`).
 *
 * Lynx CSS does not run the full transition spec, and CSS-driven enter/leave
 * loses control of timing (no `Animation.finished` Promise, no cancellation).
 * The main-thread `element.animate()` path gives us a real animation handle
 * we can drive from the background thread via `runOnMainThread`.
 *
 * Pattern:
 *   1. Bind `elRef` to a view via `:main-thread-ref="elRef"`.
 *   2. Call a helper (`fadeIn`, `slideOut`, etc.) from the background thread.
 *   3. The helper hops to the main thread and calls `element.animate()` with
 *      the right keyframes.
 *
 * Caveats:
 *   - Web target: `element.animate()` for lynx web-core landed in upstream
 *     PR #2329; older runtimes silently no-op. The helpers gate on
 *     `typeof ref.current?.animate === 'function'`, so absent support is a
 *     no-op rather than a crash — caller must keep a fallback (e.g. plain
 *     show/hide) for animation-less paint.
 *   - Worklet args are serialized across the thread bridge; only numbers /
 *     strings cross cleanly. Helpers pre-bake direction into `axis` (0|1)
 *     and percent values.
 *   - `'main thread'` is a Lynx compiler directive — the function body runs
 *     on the main thread when invoked via `runOnMainThread`. In jsdom / web
 *     test environments the directive is ignored and the function runs
 *     in-process.
 *
 * Lifted from huxpro/vue-lynx's vant-lynx port (MIT) — same Lynx animation
 * constraints apply to both projects.
 */

import { runOnMainThread, useMainThreadRef } from 'vue-lynx'

export type SlideDirection = 'up' | 'down' | 'left' | 'right'

// `runOnMainThread` must be called with the LITERAL identifier at every call
// site — SWC's worklet transform pattern-matches on `runOnMainThread(fn)`
// before wrapping `fn` and rewriting the call to dispatch through the MT
// runtime. Aliasing `const toMainThread = runOnMainThread` defeats detection
// and the worklet never registers; the runtime later throws `cannot read
// property 'bind' of undefined` on first invoke from any view whose MT
// bundle pulls this module in. The `as any` on each `fn` argument is the
// cost of `runOnMainThread`'s loose public signature
// (`(...args: unknown[]) => unknown`) — we know what we're passing.

/**
 * Creates a main-thread animation controller bound to a single element.
 *
 * @returns
 *   - `elRef` — bind to a view via `:main-thread-ref="elRef"`.
 *   - `fadeIn`/`fadeOut` — opacity 0↔1.
 *   - `slideIn`/`slideOut` — translateX/Y from off-screen.
 *   - `zoomIn`/`zoomOut` — scale 0.9↔1 with opacity. Pass `centered = true`
 *     for elements already positioned with `transform: translate(-50%, -50%)`.
 *   - `bounceIn` — spring-like scale 0 → 1.1 → 0.95 → 1.
 */
export function useAnimate() {
  const elRef = useMainThreadRef<any>(null)
  // Snapshot of the element's box BEFORE a layout-changing state write, used
  // by the FLIP `morph`. Read/written only inside MT worklets.
  const morphFromRef = useMainThreadRef<{ w: number, h: number } | null>(null)

  // -- Main-thread worklets ------------------------------------------------

  function _fadeIn(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      return elRef.current.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, fill: 'forwards', easing: 'ease-out' },
      )
    }
  }

  function _fadeOut(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      return elRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration, fill: 'forwards', easing: 'ease-in' },
      )
    }
  }

  function _slideIn(duration: number, axis: number, startPct: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY'
      return elRef.current.animate(
        [
          { transform: `${prop}(${startPct}%)` },
          { transform: `${prop}(0%)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      )
    }
  }

  function _slideOut(duration: number, axis: number, endPct: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY'
      return elRef.current.animate(
        [
          { transform: `${prop}(0%)` },
          { transform: `${prop}(${endPct}%)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-in' },
      )
    }
  }

  function _zoomIn(duration: number, baseTransform: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : ''
      return elRef.current.animate(
        [
          { opacity: 0, transform: `${prefix}scale(0.9)` },
          { opacity: 1, transform: `${prefix}scale(1)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      )
    }
  }

  function _zoomOut(duration: number, baseTransform: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : ''
      return elRef.current.animate(
        [
          { opacity: 1, transform: `${prefix}scale(1)` },
          { opacity: 0, transform: `${prefix}scale(0.9)` },
        ],
        { duration, fill: 'forwards', easing: 'ease-in' },
      )
    }
  }

  function _bounceIn(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      return elRef.current.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.6 },
          { transform: 'scale(0.95)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration, fill: 'forwards', easing: 'ease-out' },
      )
    }
  }

  // `morph` — Dynamic-Island shape transition. A FLIP (First-Last-Invert-Play)
  // animation: snapshot the box before the state change (`_captureMorph`), let
  // the layout settle to its new size, then animate width/height from the old
  // box to the new one (`_playMorph`). Unlike the fixed enter/leave helpers,
  // the from/to sizes are *measured* — so the same call morphs a pill into a
  // wide search bar, a tall panel, or back, with no hard-coded dimensions.
  //
  // `getBoundingClientRect()` exists only on the main thread, which is why both
  // halves are worklets. Reading it inside `_playMorph` forces a synchronous
  // reflow on web, so the "Last" measurement reflects the patched DOM as long
  // as the caller plays AFTER `nextTick` (DOM ops flushed to MT).
  function _captureMorph() {
    'main thread'
    const el = elRef.current
    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect()
      morphFromRef.current = { w: r.width, h: r.height }
    }
    else {
      morphFromRef.current = null
    }
  }

  function _playMorph(duration: number, easing: string) {
    'main thread'
    const el = elRef.current
    const from = morphFromRef.current
    morphFromRef.current = null
    if (
      !from
      || typeof el?.animate !== 'function'
      || typeof el.getBoundingClientRect !== 'function'
    ) {
      return
    }
    const to = el.getBoundingClientRect()
    // Same box → nothing morphed (e.g. a value/tab flip that doesn't resize);
    // skip the animation so we don't churn a no-op keyframe.
    if (from.w === to.width && from.h === to.height) return
    // `fill: 'none'` releases control back to layout once we land on `to`,
    // which already equals the element's natural new size.
    return el.animate(
      [
        { width: `${from.w}px`, height: `${from.h}px` },
        { width: `${to.width}px`, height: `${to.height}px` },
      ],
      { duration, fill: 'none', easing },
    )
  }

  // -- Background-thread wrappers ------------------------------------------

  function fadeIn(duration = 300) {
    runOnMainThread(_fadeIn as any)(duration)
  }

  function fadeOut(duration = 300) {
    runOnMainThread(_fadeOut as any)(duration)
  }

  function slideIn(direction: SlideDirection, duration = 300) {
    const [axis, pct] = getSlideParams(direction)
    runOnMainThread(_slideIn as any)(duration, axis, pct)
  }

  function slideOut(direction: SlideDirection, duration = 300) {
    const [axis, pct] = getSlideParams(direction)
    runOnMainThread(_slideOut as any)(duration, axis, pct)
  }

  function zoomIn(duration = 300, centered = false) {
    runOnMainThread(_zoomIn as any)(duration, centered ? 1 : 0)
  }

  function zoomOut(duration = 300, centered = false) {
    runOnMainThread(_zoomOut as any)(duration, centered ? 1 : 0)
  }

  function bounceIn(duration = 200) {
    runOnMainThread(_bounceIn as any)(duration)
  }

  // `captureMorph` must be called BEFORE the layout-changing state write;
  // `morph` AFTER `nextTick` (so the new layout has flushed to MT). The
  // iOS-spring-ish easing reads as the Dynamic Island settle.
  function captureMorph() {
    runOnMainThread(_captureMorph as any)()
  }

  function morph(duration = 300, easing = 'cubic-bezier(0.32, 0.72, 0, 1)') {
    runOnMainThread(_playMorph as any)(duration, easing)
  }

  return {
    elRef,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    zoomIn,
    zoomOut,
    bounceIn,
    captureMorph,
    morph,
  }
}

/**
 * Maps a slide direction to `[axis, startPercent]`:
 *   - axis: 0 = translateX, 1 = translateY
 *   - startPercent: where the element begins, as a percent of its own size
 */
function getSlideParams(direction: SlideDirection): [axis: number, pct: number] {
  switch (direction) {
    case 'up': return [1, 100] // from below
    case 'down': return [1, -100] // from above
    case 'left': return [0, -100] // from left
    case 'right': return [0, 100] // from right
  }
}
