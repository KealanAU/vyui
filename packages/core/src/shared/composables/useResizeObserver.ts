/**
 * useResizeObserver — Lynx-native replacement for the DOM `ResizeObserver`
 * (and `@vueuse/core`'s `useResizeObserver`, which silently never fires on
 * the Lynx background thread).
 *
 * The Lynx engine reports element size/position via the `layoutchange` event
 * rather than an imperatively-attached observer. You cannot attach an observer
 * to a `ShadowElement` ref — the handler must be bound in the template.
 *
 * Usage:
 * ```ts
 * const { onLayoutChange } = useResizeObserver(({ width, height }) => {
 *   // fires whenever the element's layout changes
 * })
 * ```
 * ```vue
 * <view @layoutchange="onLayoutChange" />
 * ```
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

/**
 * The shape of a Lynx `layoutchange` event. The payload normally arrives on
 * `detail`, but on Android (deprecated) it may arrive on `params`.
 */
export interface LayoutChangeEvent {
  detail?: Partial<LayoutRect>
  params?: Partial<LayoutRect>
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

function normalizeRect(payload: Partial<LayoutRect> | undefined): LayoutRect {
  const p = payload || {}
  return {
    width: toNumber(p.width),
    height: toNumber(p.height),
    top: toNumber(p.top),
    left: toNumber(p.left),
    right: toNumber(p.right),
    bottom: toNumber(p.bottom),
  }
}

/**
 * Creates a `layoutchange` handler that forwards normalized layout rects to
 * `callback`.
 *
 * @param callback - invoked with `{ width, height, top, left, right, bottom }`
 *   (pixels) every time the bound element's layout changes.
 * @returns `{ onLayoutChange }` — bind `onLayoutChange` to `@layoutchange`.
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
