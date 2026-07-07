<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
export interface ComboboxPortalProps {
  /** No-op on Lynx — content renders via OverlayRoot. */
  to?: string
  /** Used to force mounting. No-op on Lynx. */
  forceMount?: boolean
  /** Disable portalling. No-op on Lynx. */
  disabled?: boolean
}
</script>

<script setup lang="ts">
defineProps<ComboboxPortalProps>()
</script>

<template>
  <slot />
</template>
