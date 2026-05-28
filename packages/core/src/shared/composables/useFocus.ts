/**
 * useFocus — Lynx-native replacement for `element.focus()`.
 *
 * `ShadowElement` has no `focus()` method; focus is requested through the
 * cross-thread `invoke()` API. On jsdom/web there is no `invoke`, so we fall
 * back to the DOM `focus()`.
 *
 * Usage:
 * ```ts
 * useFocus(thumbElement.value)
 * ```
 *
 * To read the currently-focused element, import `getActiveElement` from
 * `vue-lynx/runtime` (not from `@/shared`). Focusable components must call
 * `notifyFocused(el)` / `notifyBlurred(el)` from their `@focus` / `@blur`
 * handlers themselves.
 */

/**
 * Requests focus on a Lynx `ShadowElement` (or a DOM element on web).
 *
 * Native focus is async — it lands after the main thread processes the op.
 * No-ops safely when `shadowEl` is nullish or supports neither API.
 *
 * @param shadowEl - the element to focus, typically `currentElement.value`
 *   from `useForwardExpose()`.
 */
export function useFocus(shadowEl: any): void {
  if (shadowEl == null)
    return

  // Native Lynx path.
  if (typeof shadowEl.invoke === 'function') {
    try {
      const op = shadowEl.invoke({ method: 'focus' })
      if (op && typeof op.exec === 'function')
        op.exec()
    }
    catch {
      // Swallow — focus is best-effort.
    }
    return
  }

  // Web / jsdom fallback.
  if (typeof shadowEl.focus === 'function') {
    try {
      shadowEl.focus()
    }
    catch {
      // Swallow — focus is best-effort.
    }
  }
}
