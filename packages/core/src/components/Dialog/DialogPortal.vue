<script lang="ts">
export interface DialogPortalProps {}
</script>

<script setup lang="ts">
// Transparent pass-through on Lynx: `overlayStore` + the app-root `OverlayRoot`
// do the portaling.
defineProps<DialogPortalProps>()
</script>

<template>
  <slot />
</template>
