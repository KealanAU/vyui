import type { AcceptableValue } from '@/shared/types'

/** Lynx has no DOM `CustomEvent` and its elements have no
 *  addEventListener/dispatchEvent, so select is a synthetic event handed
 *  straight to the callback. */
export interface SelectEvent {
  detail: { originalEvent: any, value?: AcceptableValue }
  defaultPrevented: boolean
  preventDefault: () => void
}

export function handleSelect(event: any, value: AcceptableValue | undefined, callback: (event: SelectEvent) => void) {
  let defaultPrevented = false
  callback({
    detail: { originalEvent: event, value },
    get defaultPrevented() { return defaultPrevented },
    preventDefault() { defaultPrevented = true },
  })
}
