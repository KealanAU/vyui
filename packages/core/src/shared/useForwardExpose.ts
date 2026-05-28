import type { MaybeElement } from '@vueuse/core'
import type { ComponentPublicInstance } from 'vue'
// reference: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
import { unrefElement } from '@vueuse/core'
import { computed, getCurrentInstance, onUpdated, ref, triggerRef } from 'vue'

// Lynx JS runtime (app-service worker) has no DOM globals
function isRawElement(ref: any): boolean {
  // Component instances have a `$` internal property; raw elements do not
  return typeof ref === 'object' && ref !== null && !('$' in ref)
}

export function useForwardExpose<T extends ComponentPublicInstance>() {
  const instance = getCurrentInstance()!

  const currentRef = ref<Element | T | null>()
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
    return unrefElement(currentRef as unknown as MaybeElement) as HTMLElement
  }

  // Do give us credit if you reference our code :D
  // localExpose should only be assigned once else will create infinite loop
  const localExpose: Record<string, any> | null = Object.assign({}, instance.exposed)
  const ret: Record<string, any> = {}

  // retrieve props for current instance
  for (const key in instance.props) {
    Object.defineProperty(ret, key, {
      enumerable: true,
      configurable: true,
      get: () => instance.props[key],
    })
  }

  // retrieve default exposed value
  if (Object.keys(localExpose).length > 0) {
    for (const key in localExpose) {
      Object.defineProperty(ret, key, {
        enumerable: true,
        configurable: true,
        get: () => localExpose![key],
      })
    }
  }

  // retrieve original first root element
  Object.defineProperty(ret, '$el', {
    enumerable: true,
    configurable: true,
    get: () => instance.vnode.el,
  })
  instance.exposed = ret

  function forwardRef(ref: Element | T | null) {
    currentRef.value = ref

    if (!ref)
      return

    // retrieve the forwarded element
    Object.defineProperty(ret, '$el', {
      enumerable: true,
      configurable: true,
      get: () => (isRawElement(ref) ? ref : (ref as T).$el),
    })

    // ref not is Element
    // and `useForwardExpose.test.ts > useForwardRef > should forward plain DOM element ref - 2` Passing in `$el`
    if (!isRawElement(ref) && !Object.prototype.hasOwnProperty.call(ref, '$el')) {
      // Retrieves the `exposed` data that has not been unwrapped by `vue` from `$.exposed`.
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
