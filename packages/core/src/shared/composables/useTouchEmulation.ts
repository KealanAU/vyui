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
 * Every callback is optional — only the keys whose callback was supplied
 * appear in the result.
 *
 * Background thread only. The upstream React hook also emits `main-thread-*`
 * worklet handlers; that half is deliberately not ported. Every MT gesture
 * surface here (ScrollView, Swiper, ToastSwipe, Slider, …) binds
 * `:main-thread-bind*` directly in its SFC with the worklets inlined there —
 * don't re-add an MT variant to this composable.
 *
 * Ported from `@lynx-js/react-use`'s `useTouchEmulation` (React + `useMemo`)
 * to Vue 3 (`computed`). Vue tracks callback identity automatically, so there
 * is no dependency array.
 *
 * The `'background only'` string directives at the top of each handler are
 * vue-lynx worklet hints — preserved verbatim from the upstream React port
 * (vue-lynx uses the same convention as ReactLynx).
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

import type { MouseEvent, TouchEvent } from '@lynx-js/types'
import type { ComputedRef } from 'vue'
import { computed } from 'vue'

interface UseTouchEmulationOptions {
  onTouchStart?: (event: TouchEvent) => void
  onTouchMove?: (event: TouchEvent) => void
  onTouchEnd?: (event: TouchEvent) => void
  onTouchCancel?: (event: TouchEvent) => void
}

interface UseTouchEmulationReturn {
  bindtouchstart?: (e: TouchEvent) => void
  bindmousedown?: (e: MouseEvent) => void
  bindtouchmove?: (e: TouchEvent) => void
  bindmousemove?: (e: MouseEvent) => void
  bindtouchend?: (e: TouchEvent) => void
  bindtouchcancel?: (e: TouchEvent) => void
  bindmouseup?: (e: MouseEvent) => void
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
 * Wire native touch + PC mouse events into a single set of touch callbacks.
 *
 * @param options - up to 4 optional callbacks; only the supplied ones produce
 *   `bind*` keys in the returned object.
 * @returns a `ComputedRef` of handlers ready to spread via `v-bind`.
 */
export function useTouchEmulation(
  options: UseTouchEmulationOptions,
): ComputedRef<UseTouchEmulationReturn> {
  return computed(() => {
    const { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel } = options
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

    return r
  })
}

export type { UseTouchEmulationOptions, UseTouchEmulationReturn }
