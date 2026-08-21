<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

/**
 * Where the toast stack is anchored. The vertical edge and horizontal alignment
 * are *structural* — they decide layout, so they belong on the primitive. Pixel
 * offsets, gaps, widths and motion stay the consumer's job via `:style`.
 */
export type ToastViewportPosition =
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface ToastViewportProps extends PrimitiveProps {
  /** Where the toast stack is anchored on screen. */
  position?: ToastViewportPosition
}
</script>

<script setup lang="ts">
import { getCurrentInstance, h, onUnmounted, useAttrs, useSlots } from 'vue'
import { registerOverlay, unregisterOverlay } from '@/components/OverlayRoot/overlayStore'
import { useId } from '@/shared'
import { useSafeArea } from '@/shared/composables'

// reka-ui wraps the viewport in a `<Teleport>` to escape the document flow.
// Lynx has no Teleport, and an inline `position: fixed` viewport stays trapped
// inside any `overflow: hidden` ancestor, so the stack is painted through the
// `overlayStore` portal instead — the same mechanism every other overlay uses.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<ToastViewportProps>(), {
  as: 'view',
  position: 'bottom',
})

const slots = useSlots()
// Fall-through attrs (`:style`, `data-testid`, …) must reach the rendered
// node — it is the only thing painted.
const attrs = useAttrs()
const id = useId()
// `provides` is an internal instance field, re-provided by OverlayRoot so
// `ToastProvider`'s context resolves for portalled `ToastRoot`s.
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

const ALIGN: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

// Keep the stack clear of the hardware insets (notch up top, home-indicator
// pill at the bottom) — the same container safe-area the Sheet panels pad by.
const safeArea = useSafeArea()

function viewportStyle(): Record<string, any> {
  const [edgeRaw, alignRaw] = props.position.split('-')
  const edge = edgeRaw === 'top' ? 'top' : 'bottom'
  const align = alignRaw ?? 'center'
  // A content-sized strip pinned to one edge, so taps elsewhere fall through.
  return {
    position: 'fixed',
    // Above the 1000 every overlay backdrop paints at, so a toast raised while
    // a modal is open stays visible.
    zIndex: 1100,
    left: '0px',
    right: '0px',
    [edge]: `${safeArea[edge]}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: ALIGN[align] ?? 'center',
  }
}

function renderFn() {
  // Pass the *resolved* slot vnodes — a plain element ignores a slots object,
  // so a function child would render nothing.
  return h(
    props.as,
    {
      'accessibility-traits': 'none',
      'data-position': props.position,
      ...attrs,
      style: { ...viewportStyle(), ...(attrs.style as Record<string, any> | undefined) },
    },
    slots.default?.(),
  )
}

registerOverlay(id, renderFn, capturedProvides)
onUnmounted(() => unregisterOverlay(id))
</script>

<template>
  <!-- toast stack rendered via the OverlayRoot portal -->
</template>
