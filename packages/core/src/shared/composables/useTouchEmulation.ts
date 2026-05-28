/**
 * useTouchEmulation — bridge Lynx native touch + PC mouse into a single set of
 * `onTouch*` callbacks.
 *
 * Why this exists
 * ---------------
 * Lynx components fire `bindtouchstart/move/end/cancel` on touch devices and
 * `bindmousedown/move/up` on PC. Every interaction primitive (Draggable,
 * Sortable, Swiper) needs to wire both sets and produce a uniform stream of
 * touch events. This composable owns that translation in one place.
 *
 * Returns a `ComputedRef<UseTouchEmulationReturn>` of flat `bind*` handlers
 * that you spread onto a Lynx view via `v-bind="touchHandlers"`. Mouse events
 * are translated into synthetic `TouchEvent` shapes (`touches[0]` /
 * `changedTouches[0]` plus `detail.x/y`) so callers don't have to branch on
 * input type.
 *
 * Background-thread callbacks (`onTouchStart` …) produce `bind*` keys; main-
 * thread callbacks (`onTouchStartMT` …) produce `main-thread:bind*` keys.
 * Either set (or both) is optional — only the keys whose callback was supplied
 * appear in the result.
 *
 * Ported from `@lynx-js/react-use`'s `useTouchEmulation` (React + `useMemo`)
 * to Vue 3 (`computed`). Vue tracks callback identity automatically, so there
 * is no dependency array.
 *
 * The `'background only'` / `'main thread'` string directives at the top of
 * each handler are vue-lynx worklet hints — preserved verbatim from the
 * upstream React port (vue-lynx uses the same convention as ReactLynx).
 *
 * Usage
 * -----
 * ```ts
 * const touchHandlers = useTouchEmulation({
 *   onTouchStart: (e) => { ... },
 *   onTouchMove: (e) => { ... },
 *   onTouchEnd: (e) => { ... },
 * })
 * ```
 * ```vue
 * <view v-bind="touchHandlers" />
 * ```
 */

import type { MainThread, MouseEvent, TouchEvent } from '@lynx-js/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'

interface UseTouchEmulationOptions {
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onTouchCancel?: (event: TouchEvent) => void
  onTouchStartMT?: (event: MainThread.TouchEvent) => void
  onTouchMoveMT?: (event: MainThread.TouchEvent) => void
  onTouchEndMT?: (event: MainThread.TouchEvent) => void
  onTouchCancelMT?: (event: MainThread.TouchEvent) => void
}

interface UseTouchEmulationReturn {
  bindtouchstart?: (e: TouchEvent) => void
  bindmousedown?: (e: MouseEvent) => void
  bindtouchmove?: (e: TouchEvent) => void
  bindmousemove?: (e: MouseEvent) => void
  bindtouchend?: (e: TouchEvent) => void
  bindtouchcancel?: (e: TouchEvent) => void
  bindmouseup?: (e: MouseEvent) => void
  'main-thread:bindtouchstart'?: (e: MainThread.TouchEvent) => void
  'main-thread:bindmousedown'?: (e: MainThread.MouseEvent) => void
  'main-thread:bindtouchmove'?: (e: MainThread.TouchEvent) => void
  'main-thread:bindmousemove'?: (e: MainThread.MouseEvent) => void
  'main-thread:bindtouchend'?: (e: MainThread.TouchEvent) => void
  'main-thread:bindmouseup'?: (e: MainThread.MouseEvent) => void
  'main-thread:bindtouchcancel'?: (e: MainThread.TouchEvent) => void
}

type TouchEventType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel'

/**
 * Translates a `MouseEvent` into a synthetic `TouchEvent` shape (background
 * thread). Pass-through if the event is already a touch event.
 */
function toTouchEvent(event: TouchEvent | MouseEvent, type: TouchEventType): TouchEvent {
  'background only'
  const isTouch = 'touches' in event || 'changedTouches' in event
  if (isTouch)
    return event as TouchEvent
  const mouse = event as MouseEvent & { pageX: number, pageY: number, clientX: number, clientY: number }
  const touch = {
    identifier: 1,
    pageX: mouse.pageX,
    pageY: mouse.pageY,
    clientX: mouse.clientX,
    clientY: mouse.clientY,
  }
  const touches = type === 'touchend' ? [] : [touch]
  const changedTouches = [touch]
  return {
    detail: {
      x: mouse.pageX,
      y: mouse.pageY,
    },
    touches,
    changedTouches,
  } as unknown as TouchEvent
}

/**
 * Main-thread variant of `toTouchEvent`. Preserves `target` and
 * `currentTarget` so worklets can reach back into the element.
 */
function toTouchEventMT(
  event: MainThread.TouchEvent | MainThread.MouseEvent,
  type: TouchEventType,
): MainThread.TouchEvent {
  'main thread'
  const isTouch = 'touches' in event || 'changedTouches' in event
  if (isTouch)
    return event as MainThread.TouchEvent
  const mouse = event as MainThread.MouseEvent & {
    pageX: number
    pageY: number
    clientX: number
    clientY: number
    target: any
    currentTarget: any
  }
  const touch = {
    identifier: 1,
    pageX: mouse.pageX,
    pageY: mouse.pageY,
    clientX: mouse.clientX,
    clientY: mouse.clientY,
  }
  const touches = type === 'touchend' ? [] : [touch]
  const changedTouches = [touch]
  return {
    detail: {
      x: mouse.pageX,
      y: mouse.pageY,
    },
    touches,
    changedTouches,
    target: mouse.target,
    currentTarget: mouse.currentTarget,
  } as unknown as MainThread.TouchEvent
}

/**
 * Wire native touch + PC mouse events into a single set of touch callbacks.
 *
 * @param options - up to 8 optional callbacks; only the supplied ones produce
 *   `bind*` / `main-thread:bind*` keys in the returned object.
 * @returns a `ComputedRef` of handlers ready to spread via `v-bind`.
 */
export function useTouchEmulation(
  options: UseTouchEmulationOptions,
): ComputedRef<UseTouchEmulationReturn> {
  return computed(() => {
    const {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      onTouchStartMT,
      onTouchMoveMT,
      onTouchEndMT,
      onTouchCancelMT,
    } = options
    const r: UseTouchEmulationReturn = {}

    if (onTouchStart) {
      r.bindtouchstart = (event) => {
        'background only'
        onTouchStart(toTouchEvent(event, 'touchstart'))
      }
      r.bindmousedown = (event) => {
        'background only'
        onTouchStart(toTouchEvent(event, 'touchstart'))
      }
    }
    if (onTouchMove) {
      r.bindtouchmove = (event) => {
        'background only'
        onTouchMove(toTouchEvent(event, 'touchmove'))
      }
      r.bindmousemove = (event) => {
        'background only'
        const buttons = (event as MouseEvent & { buttons?: number }).buttons
        if (!buttons || (1 & buttons) === 0)
          return
        onTouchMove(toTouchEvent(event, 'touchmove'))
      }
    }
    if (onTouchEnd) {
      r.bindtouchend = (event) => {
        'background only'
        onTouchEnd(toTouchEvent(event, 'touchend'))
      }
      r.bindmouseup = (event) => {
        'background only'
        onTouchEnd(toTouchEvent(event, 'touchend'))
      }
    }
    if (onTouchCancel) {
      r.bindtouchcancel = (event) => {
        'background only'
        onTouchCancel(toTouchEvent(event, 'touchcancel'))
      }
    }

    if (onTouchStartMT) {
      r['main-thread:bindtouchstart'] = (event) => {
        'main thread'
        onTouchStartMT(toTouchEventMT(event, 'touchstart'))
      }
      r['main-thread:bindmousedown'] = (event) => {
        'main thread'
        onTouchStartMT(toTouchEventMT(event, 'touchstart'))
      }
    }
    if (onTouchMoveMT) {
      r['main-thread:bindtouchmove'] = (event) => {
        'main thread'
        onTouchMoveMT(toTouchEventMT(event, 'touchmove'))
      }
      r['main-thread:bindmousemove'] = (event) => {
        'main thread'
        const buttons = (event as MainThread.MouseEvent & { buttons?: number }).buttons
        if (!buttons || (1 & buttons) === 0)
          return
        onTouchMoveMT(toTouchEventMT(event, 'touchmove'))
      }
    }
    if (onTouchEndMT) {
      r['main-thread:bindtouchend'] = (event) => {
        'main thread'
        onTouchEndMT(toTouchEventMT(event, 'touchend'))
      }
      r['main-thread:bindmouseup'] = (event) => {
        'main thread'
        onTouchEndMT(toTouchEventMT(event, 'touchend'))
      }
    }
    if (onTouchCancelMT) {
      r['main-thread:bindtouchcancel'] = (event) => {
        'main thread'
        onTouchCancelMT(toTouchEventMT(event, 'touchcancel'))
      }
    }

    return r
  })
}

export type { UseTouchEmulationOptions, UseTouchEmulationReturn }
