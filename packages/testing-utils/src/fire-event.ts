import { createEvent, fireEvent as domFireEvent } from '@testing-library/dom'

const eventNames = [
  'tap',
  'longtap',
  'touchstart',
  'touchmove',
  'touchcancel',
  'touchend',
  'longpress',
  'scroll',
  'scrollend',
  'focus',
  'blur',
  'input',
  'confirm',
  'keyboard',
  'layoutchange',
  'transitionend',
  'animationend',
]

export const fireEvent: Record<string, any> & ((elem: Element, event: Event) => boolean)
  = ((elem: Element, event: Event) => {
    const env = (globalThis as any).lynxTestingEnv
    const wasMain = (globalThis as any).__MAIN_THREAD__
    env?.switchToBackgroundThread()
    const result = domFireEvent(elem, event)
    if (wasMain) env?.switchToMainThread()
    return result
  }) as any

for (const key of eventNames) {
  fireEvent[key] = (elem: Element, init?: Record<string, unknown>): boolean => {
    const env = (globalThis as any).lynxTestingEnv
    const wasMain = (globalThis as any).__MAIN_THREAD__
    env?.switchToBackgroundThread()
    const eventType = (init?.eventType as string) ?? 'bindEvent'
    const eventInit = { eventType, eventName: key, ...init }
    const event = createEvent(`${eventType}:${key}`, elem, eventInit)
    Object.assign(event, eventInit)
    const result = domFireEvent(elem, event)
    if (wasMain) env?.switchToMainThread()
    return result
  }
}
