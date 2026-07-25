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

  // -- Main-thread worklets ------------------------------------------------

  // Write the animation's end state inline before animating: Lynx web's
  // animation PAPI reads Lynx-style timing keys (fillMode/timingFunction) and
  // silently drops WAAPI fill/easing, so a fill-forwards preset would finish
  // fill-less on web and snap back. The inline value is what the element
  // rests on either way; both key spellings are passed below.
  function _restAt(opacity: string | null, transform: string | null) {
    'main thread'
    const el = elRef.current
    if (!el?.setStyleProperty) return
    if (opacity !== null) el.setStyleProperty('opacity', opacity)
    if (transform !== null) el.setStyleProperty('transform', transform)
  }

  function _fadeIn(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      _restAt('1', null)
      return elRef.current.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-out', timingFunction: 'ease-out' },
      )
    }
  }

  function _fadeOut(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      _restAt('0', null)
      return elRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-in', timingFunction: 'ease-in' },
      )
    }
  }

  function _slideIn(duration: number, axis: number, startPct: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY'
      _restAt(null, `${prop}(0%)`)
      return elRef.current.animate(
        [
          { transform: `${prop}(${startPct}%)` },
          { transform: `${prop}(0%)` },
        ],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-out', timingFunction: 'ease-out' },
      )
    }
  }

  function _slideOut(duration: number, axis: number, endPct: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prop = axis === 0 ? 'translateX' : 'translateY'
      _restAt(null, `${prop}(${endPct}%)`)
      return elRef.current.animate(
        [
          { transform: `${prop}(0%)` },
          { transform: `${prop}(${endPct}%)` },
        ],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-in', timingFunction: 'ease-in' },
      )
    }
  }

  function _zoomIn(duration: number, baseTransform: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : ''
      _restAt('1', `${prefix}scale(1)`)
      return elRef.current.animate(
        [
          { opacity: 0, transform: `${prefix}scale(0.9)` },
          { opacity: 1, transform: `${prefix}scale(1)` },
        ],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-out', timingFunction: 'ease-out' },
      )
    }
  }

  function _zoomOut(duration: number, baseTransform: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      const prefix = baseTransform === 1 ? 'translate(-50%, -50%) ' : ''
      _restAt('0', `${prefix}scale(0.9)`)
      return elRef.current.animate(
        [
          { opacity: 1, transform: `${prefix}scale(1)` },
          { opacity: 0, transform: `${prefix}scale(0.9)` },
        ],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-in', timingFunction: 'ease-in' },
      )
    }
  }

  function _bounceIn(duration: number) {
    'main thread'
    if (typeof elRef.current?.animate === 'function') {
      _restAt('1', 'scale(1)')
      return elRef.current.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.6 },
          { transform: 'scale(0.95)', opacity: 1, offset: 0.8 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        { duration, fill: 'forwards', fillMode: 'forwards', easing: 'ease-out', timingFunction: 'ease-out' },
      )
    }
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

  return {
    elRef,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    zoomIn,
    zoomOut,
    bounceIn,
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
