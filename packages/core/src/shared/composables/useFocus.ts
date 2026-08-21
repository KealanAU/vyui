/**
 * useFocus — Lynx-native replacement for `element.focus()`. `ShadowElement` has
 * no `focus()`; focus is requested through the cross-thread `invoke()` API, with
 * the DOM `focus()` as the jsdom/web fallback.
 *
 * To read the currently-focused element, import `getActiveElement` from
 * `vue-lynx/runtime`. Focusable components must call `notifyFocused(el)` /
 * `notifyBlurred(el)` from their `@focus` / `@blur` handlers themselves.
 */

/**
 * Requests focus on a Lynx `ShadowElement` (or a DOM element on web). Native
 * focus is async — it lands after the main thread processes the op. No-ops when
 * `shadowEl` is nullish or supports neither API.
 */
export function useFocus(shadowEl: any): void {
  if (shadowEl == null)
    return

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

  if (typeof shadowEl.focus === 'function') {
    try {
      shadowEl.focus()
    }
    catch {
      // Swallow — focus is best-effort.
    }
  }
}
