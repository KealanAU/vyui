/**
 * useElementRect — Lynx-native replacement for `getBoundingClientRect()` and
 * one-shot `offset*` reads.
 *
 * On Lynx, layout lives on the main thread, so reading it from the background
 * thread is an async cross-thread query via the `boundingClientRect` UI method
 * (`shadowElement.invoke(...)`); on jsdom/web there is no `invoke`, so the DOM
 * `getBoundingClientRect()` stands in.
 *
 * Do NOT call this synchronously in `onMounted` — the element may not be painted
 * on the main thread yet.
 */

import { ZERO_RECT, normalizeRect, type LayoutRect } from './useResizeObserver.js'

/**
 * Resolves the layout rectangle of a Lynx `ShadowElement` (or a DOM element on
 * web).
 *
 * @param shadowEl - the element to measure; nullish resolves to a zeroed rect.
 * @returns `{ width, height, top, left, right, bottom }` in pixels.
 */
export function useElementRect(shadowEl: any): Promise<LayoutRect> {
  if (shadowEl == null)
    return Promise.resolve({ ...ZERO_RECT })

  // Native Lynx path — async cross-thread SelectorQuery. `fields()` has no
  // `rect`/`size` and silently resolves to zeros; geometry comes from the
  // `boundingClientRect` UI method via `invoke()`.
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
  // `invoke()`, so use the synchronous DOM call.
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
