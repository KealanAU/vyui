import type { ComponentPublicInstance } from 'vue'
import type { ElementHandle } from './types'
// reference: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
import { computed, getCurrentInstance, onUpdated, ref, triggerRef } from 'vue'

// Lynx JS runtime (app-service worker) has no DOM globals
function isRawElement(ref: any): boolean {
  // Component instances have a `$` internal property; raw elements do not
  return typeof ref === 'object' && ref !== null && !('$' in ref)
}

export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getCurrentInstance()!

  const currentRef = ref<ElementHandle | T | null>()
  const currentElement = computed(() => resolveCurrentElement())

  // When using as-child with conditional rendering (v-if/v-else), the underlying
  // DOM element ($el) changes but currentRef (component instance) stays the same.
  // Since $el is not reactive, we sync currentElement after DOM updates.
  onUpdated(() => {
    if (currentElement.value !== resolveCurrentElement()) {
      triggerRef(currentRef)
    }
  })

  function resolveCurrentElement() {
    const el = currentRef.value as any
    return (el?.$el ?? el) as ElementHandle
  }

  // localExpose should only be assigned once else will create infinite loop
  const localExpose: Record<string, any> | null = Object.assign({}, instance.exposed)
  const ret: Record<string, any> = {}

  for (const key in instance.props) {
    Object.defineProperty(ret, key, {
      enumerable: true,
      configurable: true,
      get: () => instance.props[key],
    })
  }

  if (Object.keys(localExpose).length > 0) {
    for (const key in localExpose) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        configurable: true,
        get: () => localExpose![key],
      })
    }
  }

  Object.defineProperty(ret, '$el', {
    enumerable: true,
    configurable: true,
    get: () => instance.vnode.el,
  })
  instance.exposed = ret

  function forwardRef(ref: ElementHandle | T | null) {
    currentRef.value = ref

    if (!ref)
      return

    Object.defineProperty(ret, '$el', {
      enumerable: true,
      configurable: true,
      get: () => (isRawElement(ref) ? ref : (ref as T).$el),
    })

    // A component instance, and not one that was passed its own `$el`. Only
    // then is there a child `exposed` object to bubble up.
    if (!isRawElement(ref) && !Object.prototype.hasOwnProperty.call(ref, '$el')) {
      const childExposed = (ref as T).$.exposed
      const merged = Object.assign({}, ret)

      for (const key in childExposed) {
        Object.defineProperty(merged, key, {
          enumerable: true,
          configurable: true,
          get: () => childExposed[key],
        })
      }

      instance.exposed = merged
    }
  }

  return { forwardRef, currentRef, currentElement }
}
