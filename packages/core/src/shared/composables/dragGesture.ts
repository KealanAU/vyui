/**
 * Drag gesture utilities — shared across every Lynx surface that listens to
 * touch + mouse and converts the event into an `{ x, y }` coordinate.
 *
 * Why this exists
 * ---------------
 * Lynx web only bridges DOM `touch*` events, so a desktop mouse fires nothing
 * unless the component ALSO wires `@mousedown` / `:global-bindmousemove` /
 * `:global-bindmouseup`. And the naïve `event?.touches?.[0] ?? event?.detail
 * ?? event` chain swallows mouse coords because a mouse event's `detail` is
 * `{}` (truthy but empty) — short-circuiting before the top-level
 * `clientX/clientY` ever gets read.
 *
 * Both bugs hit at least 6 component files (Splitter, Drawer, Slider H/V,
 * ColorArea, ColorSlider). This module is the single source of truth.
 *
 * Conventions
 * -----------
 * - Coordinates are viewport-relative (`clientX/clientY` preferred) — this
 *   matches the rect returned by `useElementRect` (which calls Lynx's
 *   `boundingClientRect` UI method, viewport-relative). Mixing element- or
 *   page-relative coords with a viewport rect produces a wrong delta.
 * - A `pageX/pageY` fallback is included so callers that compare *deltas*
 *   (Splitter / Drawer) keep working even on event shapes that omit
 *   `clientX/clientY`. The delta math is correct as long as both ends of the
 *   subtraction live in the same space.
 *
 * Usage
 * -----
 *   <Primitive
 *     @touchstart="(e: any) => startDrag(e)"
 *     @touchmove="(e: any) => moveDrag(e, 'touch')"
 *     @touchend="endDrag"
 *     @touchcancel="endDrag"
 *     @mousedown="(e: any) => startDrag(e)"
 *     :global-bindmousemove="(e: any) => moveDrag(e, 'mouse')"
 *     :global-bindmouseup="endDrag"
 *   />
 *
 *   function moveDrag(event: any, kind: 'touch' | 'mouse') {
 *     if (kind === 'mouse' && isMouseReleased(event)) {
 *       endDrag()
 *       return
 *     }
 *     const { x, y } = getDragPoint(event)
 *     ...
 *   }
 */

export interface DragPoint {
  x: number
  y: number
}

/**
 * Extract viewport-relative coordinates from a Lynx touch OR mouse event.
 *
 * Branches on event shape:
 *   1. Touch: read `touches[0]` / `changedTouches[0]`.
 *   2. Mouse: read top-level `clientX/clientY` (then `pageX/pageY`, then `x/y`).
 *   3. Last resort: `event.detail.x/y` (some Lynx touch payloads carry coords
 *      here when neither array nor top-level fields are set).
 *
 * Returns `{ x: 0, y: 0 }` if no recognisable coord is found.
 */
export function getDragPoint(event: any): DragPoint {
  const t = event?.touches?.[0] ?? event?.changedTouches?.[0]
  if (t) {
    const x = t.clientX ?? t.pageX ?? t.x ?? 0
    const y = t.clientY ?? t.pageY ?? t.y ?? 0
    return { x, y }
  }
  // Mouse event — coords sit on the event itself. Crucially, we do NOT fall
  // through `event.detail` first: mouse `detail` is `{}` (truthy but empty)
  // and would short-circuit the chain.
  const mx = event?.clientX ?? event?.pageX ?? event?.x
  const my = event?.clientY ?? event?.pageY ?? event?.y
  if (mx != null && my != null)
    return { x: mx, y: my }
  // Last resort — touch `detail` carries coords on some Lynx event shapes.
  return { x: event?.detail?.x ?? 0, y: event?.detail?.y ?? 0 }
}

/**
 * Detects a "drag released" condition on a Lynx web mouse-move event.
 *
 * Lynx web does not reliably deliver `mouseup` to JS, so the drag would
 * otherwise stick to the cursor after release. If a `mousemove` arrives with
 * no button held (`event.buttons === 0`), the user has released — end the
 * drag yourself.
 *
 * Only meaningful for mouse events; touch handlers should ignore it (touch
 * uses implicit capture and `touchend` fires reliably on iOS).
 */
export function isMouseReleased(event: any): boolean {
  return event?.buttons === 0
}
