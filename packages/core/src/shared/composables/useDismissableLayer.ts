/**
 * useDismissableLayer — Lynx-native equivalent of reka-ui's `DismissableLayer`.
 *
 * As in reka-ui, outside interaction emits *preventable* events from the content
 * component and a consumer disables dismissal with `event.preventDefault()` —
 * there is no `dismissible` boolean, the event is the API.
 *
 * Lynx constraints vs. the DOM original: there is no `pointerdown`, so outside
 * interaction is a `tap` on the overlay backdrop `<view>`; there is no
 * focus-outside model, so `focusOutside` is omitted; and hardware keyboards
 * aren't wired, so `escapeKeyDown` is omitted too.
 */

/** A preventable outside-interaction event. Mirrors reka-ui's event shape. */
export interface DismissableLayerEvent {
  /** The raw Lynx event that triggered the dismissal attempt, if any. */
  originalEvent: unknown
  /** Marks the interaction as handled — the layer is kept open. */
  preventDefault: () => void
  /** Whether `preventDefault()` has been called. */
  readonly defaultPrevented: boolean
}

/** The events every dismissable overlay `*Content` component emits. */
export type DismissableLayerEmits = {
  /** Fired when an interaction (a tap on Lynx) happens outside the layer. Call
   *  `event.preventDefault()` to keep the layer open. */
  interactOutside: [event: DismissableLayerEvent]
  /** Fired alongside `interactOutside` for the pointer/tap case — the same
   *  event object, so preventing either keeps the layer open. */
  pointerDownOutside: [event: DismissableLayerEvent]
}

/**
 * The shape `useDismissableLayer` needs from a component's `emit`. Typed
 * permissively because `defineEmits<DismissableLayerEmits>()` produces an
 * intersection of literal-keyed signatures that never narrows to a union-keyed
 * one; per-event safety lives in `DismissableLayerEmits`.
 */
export type DismissableLayerEmit = (
  event: keyof DismissableLayerEmits,
  payload: DismissableLayerEvent,
) => void

export interface UseDismissableLayerOptions {
  /** The component's `emit` — used to surface the preventable events. */
  emit: (...args: any[]) => void
  /** Called to dismiss the layer when an interaction is not prevented. */
  onDismiss: () => void
}

function createEvent(originalEvent: unknown): DismissableLayerEvent {
  let prevented = false
  return {
    originalEvent,
    preventDefault() {
      prevented = true
    },
    get defaultPrevented() {
      return prevented
    },
  }
}

/**
 * Wires the preventable-event dismissal flow for an overlay content component.
 *
 * @returns `onInteractOutside` — bind to the backdrop view's `onTap`.
 */
export function useDismissableLayer(options: UseDismissableLayerOptions) {
  function dispatch(
    names: (keyof DismissableLayerEmits)[],
    originalEvent: unknown,
  ) {
    const event = createEvent(originalEvent)
    for (const name of names)
      options.emit(name, event)
    if (!event.defaultPrevented)
      options.onDismiss()
  }

  /** Bind to the backdrop `<view>`'s `onTap`. */
  function onInteractOutside(originalEvent?: unknown) {
    dispatch(['pointerDownOutside', 'interactOutside'], originalEvent)
  }

  return { onInteractOutside }
}
