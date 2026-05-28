import type { ComponentPublicInstance } from 'vue'
import { unrefElement } from '@vueuse/core'
import { computed, ref } from 'vue'

export function usePrimitiveElement<T extends ComponentPublicInstance>() {
  const primitiveElement = ref<T>()
  const currentElement = computed(() => unrefElement(primitiveElement) as HTMLElement | undefined)

  return {
    primitiveElement,
    currentElement,
  }
}
