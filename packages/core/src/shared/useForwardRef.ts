import type { ComponentPublicInstance } from 'vue'
import type { ElementHandle } from './types'
// reference: https://github.com/vuejs/rfcs/issues/258#issuecomment-1068697672
import { getCurrentInstance } from 'vue'

export function useForwardRef() {
  const instance = getCurrentInstance()!
  function handleRefChange(ref: ElementHandle | ComponentPublicInstance | null) {
    if (typeof ref === 'object') {
      instance.exposed = ref
      instance.exposeProxy = ref
    }
  }
  return handleRefChange
}
