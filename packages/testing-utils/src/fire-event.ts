import { createEvent, fireEvent as domFireEvent } from '@testing-library/dom'

export const eventMap: Record<string, { defaultInit: Record<string, unknown> }> = {
  tap: { defaultInit: {} },
  longtap: { defaultInit: {} },
  touchstart: { defaultInit: {} },
  touchmove: { defaultInit: {} },
  touchcancel: { defaultInit: {} },
  touchend: { defaultInit: {} },
  longpress: { defaultInit: {} },
  scroll: { defaultInit: {} },
  scrollend: { defaultInit: {} },
  focus: { defaultInit: {} },
  blur: { defaultInit: {} },
  input: { defaultInit: {} },
  confirm: { defaultInit: {} },
  layoutchange: { defaultInit: {} },
  transitionend: { defaultInit: {} },
  animationend: { defaultInit: {} },
}

export const fireEvent: Record<string, any> & ((elem: Element, event: Event) => boolean)
  = ((elem: Element, event: Event) => {
    const env = (globalThis as any).lynxTestingEnv
    const wasMain = (globalThis as any).__MAIN_THREAD__
    env?.switchToBackgroundThread()
    const result = domFireEvent(elem, event)
    if (wasMain) env?.switchToMainThread()
    return result
  }) as any

for (const key of Object.keys(eventMap)) {
  fireEvent[key] = (elem: Element, init?: Record<string, unknown>): boolean => {
    const env = (globalThis as any).lynxTestingEnv
    const wasMain = (globalThis as any).__MAIN_THREAD__
    env?.switchToBackgroundThread()
    const eventType = (init?.eventType as string) ?? 'bindEvent'
    const eventInit = { eventType, eventName: key, ...eventMap[key]!.defaultInit, ...init }
    const event = createEvent(`${eventType}:${key}`, elem, eventInit)
    Object.assign(event, eventInit)
    const result = domFireEvent(elem, event)
    if (wasMain) env?.switchToMainThread()
    return result
  }
}
