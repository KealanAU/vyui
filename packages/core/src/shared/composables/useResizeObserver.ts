/**
 * useResizeObserver — Lynx-native replacement for the DOM `ResizeObserver` (and
 * `@vueuse/core`'s, which silently never fires on the Lynx background thread).
 *
 * Lynx reports element size/position via the `layoutchange` event rather than an
 * imperatively-attached observer: you cannot attach one to a `ShadowElement`
 * ref, so the returned handler must be bound in the template
 * (`<view @layoutchange="onLayoutChange" />`).
 */

/** A layout rectangle in pixels, as reported by Lynx `layoutchange`. */
export interface LayoutRect {
  width: number
  height: number
  top: number
  left: number
  right: number
  bottom: number
}

/** The shape of a Lynx `layoutchange` event. The payload normally arrives on
 *  `detail`, but on Android (deprecated) it may arrive on `params`. */
export interface LayoutChangeEvent {
  detail?: Partial<LayoutRect>
  params?: Partial<LayoutRect>
}

export const ZERO_RECT: LayoutRect = {
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

/** Coerces a `layoutchange` payload or a `boundingClientRect` response to a
 *  fully-populated rect. Lynx `fields({ rect })` returns only the four edges,
 *  so width/height are derived from them when absent. */
export function normalizeRect(raw: any): LayoutRect {
  if (!raw || typeof raw !== 'object')
    return { ...ZERO_RECT }

  const top = toNumber(raw.top)
  const left = toNumber(raw.left)
  const right = toNumber(raw.right)
  const bottom = toNumber(raw.bottom)

  return {
    width: raw.width !== undefined ? toNumber(raw.width) : right - left,
    height: raw.height !== undefined ? toNumber(raw.height) : bottom - top,
    top,
    left,
    right,
    bottom,
  }
}

/**
 * Creates a `layoutchange` handler that forwards normalized layout rects to
 * `callback`, in pixels. Bind the returned `onLayoutChange` to `@layoutchange`.
 */
export function useResizeObserver(callback: (rect: LayoutRect) => void) {
  function onLayoutChange(event: LayoutChangeEvent | undefined): void {
    if (typeof callback !== 'function')
      return

    const payload = event
      ? (event.detail !== undefined ? event.detail : event.params)
      : undefined

    callback(normalizeRect(payload))
  }

  return { onLayoutChange }
}
