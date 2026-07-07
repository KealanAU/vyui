<script lang="ts">
export interface DialogPortalProps {
  /**
   * Inert on Lynx. Actual portaling is handled by `overlayStore` + the app-root `OverlayRoot`,
   * so this selector is never read. No default is supplied — the prop is
   * meaningless and supplying `'#overlay-root'` would falsely imply a DOM
   * target.
   */
  to?: string
}
</script>

<script setup lang="ts">
// Component is a transparent pass-through on Lynx; see prop doc above.
defineProps<DialogPortalProps>()
</script>

<template>
  <slot />
</template>
