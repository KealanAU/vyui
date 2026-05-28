/**
 * useElementRect — Lynx-native replacement for `getBoundingClientRect()` and
 * one-shot `offsetWidth` / `offsetHeight` / `offsetLeft` / `offsetTop` reads.
 *
 * On Lynx, layout lives on the main thread; reading it from the background
 * thread is an async cross-thread query via the `boundingClientRect` UI method
 * (`shadowElement.invoke(...)`). On jsdom/web there is no `invoke` method, so we
 * fall back to the DOM `getBoundingClientRect()`.
 *
 * Usage:
 * ```ts
 * const { currentElement } = useForwardExpose()
 * // inside a @touchstart / @layoutchange handler — element must be painted
 * const rect = await useElementRect(currentElement.value)
 * ```
 *
 * Do NOT call this synchronously in `onMounted` — the element may not be
 * painted on the main thread yet.
 */

import type { LayoutRect } from './useResizeObserver.js'

const ZERO_RECT: LayoutRect = {
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

function normalizeRect(raw: any): LayoutRect {
  if (!raw || typeof raw !== 'object')
    return { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }

  const top = toNumber(raw.top)
  const left = toNumber(raw.left)
  const right = toNumber(raw.right)
  const bottom = toNumber(raw.bottom)

  // Lynx `fields({ rect })` returns only the four edges — `width`/`height`
  // come from `fields({ size })`. When the response carries no explicit
  // dimensions, derive them from the edges so callers never divide by zero.
  const width = raw.width !== undefined ? toNumber(raw.width) : right - left
  const height = raw.height !== undefined ? toNumber(raw.height) : bottom - top

  return { width, height, top, left, right, bottom }
}

/**
 * Resolves the layout rectangle of a Lynx `ShadowElement` (or a DOM element
 * on web).
 *
 * @param shadowEl - the element to measure, typically `currentElement.value`
 *   from `useForwardExpose()`. If nullish, resolves to a zeroed rect.
 * @returns a Promise resolving to `{ width, height, top, left, right, bottom }`
 *   in pixels.
 */
export function useElementRect(shadowEl: any): Promise<LayoutRect> {
  if (shadowEl == null)
    return Promise.resolve({ ...ZERO_RECT })

  // Native Lynx path — async cross-thread SelectorQuery.
  //
  // NOTE: `fields()` only exposes `id/dataset/tag/index/class/attribute/query`
  // — it has no `rect`/`size`, so it silently resolves to zeros. Layout geometry
  // comes from the `boundingClientRect` UI method via `invoke()`, whose `success`
  // payload carries `{ left, top, right, bottom, width, height }`.
  if (typeof shadowEl.invoke === 'function') {
    return new Promise<LayoutRect>((resolve) => {
      try {
        const query = shadowEl.invoke({
          method: 'boundingClientRect',
          params: {},
          success: (res: any) => resolve(normalizeRect(res)),
          fail: () => resolve({ ...ZERO_RECT }),
        })
        if (query && typeof query.exec === 'function')
          query.exec()
      }
      catch {
        resolve({ ...ZERO_RECT })
      }
    })
  }

  // Web preview (Rspeedy dev / jsdom): elements are HTMLElements with no
  // `invoke()`. Use the synchronous DOM call so the indicator can measure
  // and the pill actually paints in the browser.
  if (typeof shadowEl.getBoundingClientRect === 'function') {
    try {
      return Promise.resolve(normalizeRect(shadowEl.getBoundingClientRect()))
    }
    catch {
      return Promise.resolve({ ...ZERO_RECT })
    }
  }

  return Promise.resolve({ ...ZERO_RECT })
}
