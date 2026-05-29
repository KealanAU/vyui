/**
 * Minimal keyboard-event shape. Lynx native has no DOM `KeyboardEvent`; these
 * helpers are web/PC-keyboard parity only, so they take just the fields they
 * read. Avoids leaking DOM `KeyboardEvent` into the emitted `.d.ts`.
 */
interface KeyEventLike {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
}

export function isCut(event: KeyEventLike) {
  return (event.key === 'x' || event.key === 'X') && (event.ctrlKey || event.metaKey)
}

export function isCopy(event: KeyEventLike) {
  return (event.key === 'c' || event.key === 'C') && (event.ctrlKey || event.metaKey)
}

export function isPaste(event: KeyEventLike) {
  return (event.key === 'v' || event.key === 'V') && (event.ctrlKey || event.metaKey)
}
