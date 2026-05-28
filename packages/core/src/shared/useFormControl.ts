import type { MaybeElementRef } from '@vueuse/core'
import { computed } from 'vue'

// Lynx has no HTML form elements — always report as not inside a form.
export function useFormControl(_el: MaybeElementRef) {
  return computed(() => false)
}
