import type { ComponentPublicInstance } from 'vue'
import type { ElementHandle } from '@/shared/types'
import { unrefElement } from '@vueuse/core'
import { computed, ref } from 'vue'

export function usePrimitiveElement<T extends ComponentPublicInstance>() {
  const primitiveElement = ref<T>()
  const currentElement = computed(() => unrefElement(primitiveElement) as ElementHandle | undefined)

  return {
    primitiveElement,
    currentElement,
  }
}
