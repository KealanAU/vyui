/**
 * useScrollTo — scroll helper for the Lynx `<scroll-view>` element.
 *
 * Needed by Phase 3 `ScrollArea` and by `Select` scroll buttons.
 *
 * On Lynx, a `<scroll-view>` is scrolled through the cross-thread `invoke()`
 * API: `invoke({ method: 'scrollTo', params: { offset, smooth } })`. On
 * jsdom/web there is no `invoke`, so we fall back to the DOM `scrollTo()` /
 * `scrollIntoView()`.
 *
 * Assumptions (documented because the Lynx `scroll-view` invoke API is not
 * fully specified upstream):
 * - `scrollTo` accepts `{ offset: number, smooth: boolean }`. `offset` is the
 *   absolute scroll position in pixels along the scroll axis.
 * - There is no reliable cross-thread `scrollIntoView` op, so
 *   `scrollIntoView` is implemented as: measure the child rect and the
 *   scroll-view rect via `useElementRect`, compute the delta, and `scrollTo`
 *   the resulting offset. This is offset-based and assumes a vertical
 *   scroll-view by default (`axis: 'y'`); pass `axis: 'x'` for horizontal.
 *
 * Usage:
 * ```ts
 * const { scrollBy, scrollToOffset, scrollIntoView } = useScrollTo(scrollViewEl)
 * scrollToOffset(0)                       // jump to top
 * scrollBy(120)                           // scroll down 120px
 * await scrollIntoView(childEl)           // bring a child into view
 * ```
 */

import { useElementRect } from './useElementRect.js'

/** Axis a `<scroll-view>` scrolls along. */
export type ScrollAxis = 'x' | 'y'

/** Options for a single scroll operation. */
export interface ScrollOptions {
  /** Animate the scroll. Defaults to `true`. */
  smooth?: boolean
  /** Axis to scroll along. Defaults to `'y'`. */
  axis?: ScrollAxis
}

function nativeScrollTo(scrollViewEl: any, offset: number, smooth: boolean): boolean {
  if (scrollViewEl == null || typeof scrollViewEl.invoke !== 'function')
    return false
  try {
    const op = scrollViewEl.invoke({
      method: 'scrollTo',
      params: { offset, smooth },
    })
    if (op && typeof op.exec === 'function')
      op.exec()
  }
  catch {
    // Swallow — scrolling is best-effort.
  }
  return true
}

/**
 * Creates scroll helpers bound to a single Lynx `<scroll-view>` element.
 *
 * @param scrollViewEl - the scroll-view element, typically
 *   `currentElement.value` from `useForwardExpose()`.
 */
export function useScrollTo(scrollViewEl: any) {
  /**
   * Scrolls to an absolute offset (pixels) along the scroll axis.
   *
   * @param offset - absolute scroll position in pixels.
   * @param options - `{ smooth }`.
   */
  function scrollToOffset(offset: number, options: ScrollOptions = {}): void {
    const smooth = options.smooth !== false
    if (nativeScrollTo(scrollViewEl, offset, smooth))
      return

    // Web / jsdom fallback.
    if (scrollViewEl != null && typeof scrollViewEl.scrollTo === 'function') {
      const axis = options.axis === 'x' ? 'left' : 'top'
      try {
        scrollViewEl.scrollTo({ [axis]: offset, behavior: smooth ? 'smooth' : 'auto' })
      }
      catch {
        // Swallow.
      }
    }
  }

  /**
   * Scrolls by a relative delta (pixels) from the current position.
   *
   * On native the current offset is read from the scroll-view rect; on web it
   * is read from `scrollTop` / `scrollLeft`.
   *
   * @param delta - pixels to scroll by; positive scrolls forward.
   * @param options - `{ smooth, axis }`.
   */
  async function scrollBy(delta: number, options: ScrollOptions = {}): Promise<void> {
    const axis: ScrollAxis = options.axis === 'x' ? 'x' : 'y'

    // Web / jsdom: scrollBy is directly supported.
    if (
      scrollViewEl != null
      && typeof scrollViewEl.invoke !== 'function'
      && typeof scrollViewEl.scrollBy === 'function'
    ) {
      const key = axis === 'x' ? 'left' : 'top'
      try {
        scrollViewEl.scrollBy({ [key]: delta, behavior: options.smooth !== false ? 'smooth' : 'auto' })
      }
      catch {
        // Swallow.
      }
      return
    }

    // Native: read current offset, add delta, scrollTo.
    let current = 0
    if (scrollViewEl != null && typeof scrollViewEl.scrollTop === 'number')
      current = axis === 'x' ? scrollViewEl.scrollLeft : scrollViewEl.scrollTop

    scrollToOffset(current + delta, options)
  }

  /**
   * Scrolls a descendant element into view within the scroll-view.
   *
   * Offset-based: measures the child relative to the scroll-view and scrolls
   * so the child's leading edge aligns with the scroll-view's leading edge.
   *
   * @param childEl - the descendant element to reveal.
   * @param options - `{ smooth, axis }`.
   */
  async function scrollIntoView(childEl: any, options: ScrollOptions = {}): Promise<void> {
    if (childEl == null)
      return

    // Web / jsdom: native scrollIntoView is the most accurate.
    if (
      typeof childEl.scrollIntoView === 'function'
      && (scrollViewEl == null || typeof scrollViewEl.invoke !== 'function')
    ) {
      try {
        childEl.scrollIntoView({ behavior: options.smooth !== false ? 'smooth' : 'auto', block: 'nearest' })
      }
      catch {
        // Swallow.
      }
      return
    }

    // Native: compute delta from measured rects.
    const axis: ScrollAxis = options.axis === 'x' ? 'x' : 'y'
    const [childRect, viewRect] = await Promise.all([
      useElementRect(childEl),
      useElementRect(scrollViewEl),
    ])

    let current = 0
    if (scrollViewEl != null && typeof scrollViewEl.scrollTop === 'number')
      current = axis === 'x' ? scrollViewEl.scrollLeft : scrollViewEl.scrollTop

    const delta = axis === 'x'
      ? childRect.left - viewRect.left
      : childRect.top - viewRect.top

    scrollToOffset(current + delta, options)
  }

  return { scrollToOffset, scrollBy, scrollIntoView }
}
