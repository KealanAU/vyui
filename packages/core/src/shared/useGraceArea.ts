/**
 * No-op stub.
 *
 * `useGraceArea` powers grace-area hover detection between a popover/tooltip
 * trigger and its content. It is pointer/mouse-only and depends on DOM APIs
 * (`getBoundingClientRect`, `addEventListener('pointermove'/'pointerleave')`,
 * `ownerDocument`) that do not exist on Lynx. Lynx has no hover, only tap.
 *
 * The named export shape is preserved so callers still type-check. Every
 * function returns immediately without doing anything. This will be revisited
 * when web / mobile-browser support lands.
 */
import type { Ref } from 'vue'
import { ref } from 'vue'

export function useGraceArea(_triggerElement: Ref<HTMLElement | undefined>, _containerElement: Ref<HTMLElement | undefined>) {
  const isPointerInTransit = ref(false)

  function onPointerExit(_fn: () => void) {
    // no-op: no pointer events on Lynx.
    return () => {}
  }

  return {
    isPointerInTransit,
    onPointerExit,
  }
}
