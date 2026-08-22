import type { ComponentPublicInstance } from 'vue'
import type { ElementHandle } from '@/shared/types'
import { computed, ref } from 'vue'

export function usePrimitiveElement<T extends ComponentPublicInstance>() {
  const primitiveElement = ref<T>()
  const currentElement = computed(() => {
    const el = primitiveElement.value as any
    return (el?.$el ?? el) as ElementHandle | undefined
  })

  return {
    primitiveElement,
    currentElement,
  }
}
