/**
 * Synthetic custom-event shape passed to handlers. On Lynx there is no DOM
 * `CustomEvent`; this mirrors the subset call sites read (`detail`,
 * `defaultPrevented`, `preventDefault`). Typed locally so the public signature
 * doesn't leak DOM `CustomEvent` / `Event` into consumers' `.d.ts`.
 */
export interface VyCustomEvent<D = any> {
  detail: D
  defaultPrevented?: boolean
  preventDefault?: () => void
}

export function handleAndDispatchCustomEvent<
  E extends VyCustomEvent,
  OriginalEvent = any,
>(
  name: string,
  handler: ((event: E) => void) | undefined,
  detail: { originalEvent: OriginalEvent } & (E extends VyCustomEvent<infer D>
    ? D
    : never),
) {
  // Lynx has no CustomEvent, and its elements (even in web mode) don't
  // implement addEventListener/dispatchEvent — call the handler directly with
  // a synthetic event. `target` is left undefined when CustomEvent is missing
  // so `detail.originalEvent.target` is never read in that path.
  const target = typeof CustomEvent === 'undefined' ? undefined : detail.originalEvent.target
  if (!target || typeof (target as any).addEventListener !== 'function') {
    if (handler) {
      let defaultPrevented = false
      const syntheticEvent = {
        detail,
        bubbles: false,
        cancelable: true,
        get defaultPrevented() { return defaultPrevented },
        preventDefault() { defaultPrevented = true },
      } as unknown as E
      handler(syntheticEvent)
    }
    return
  }

  const event = new CustomEvent(name, {
    bubbles: false,
    cancelable: true,
    detail,
  })
  if (handler)
    target.addEventListener(name, handler as unknown as EventListener, { once: true })

  target.dispatchEvent(event)
}
