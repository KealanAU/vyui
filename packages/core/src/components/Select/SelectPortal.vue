<script lang="ts">
export interface SelectPortalProps {
  /** The target selector for the Teleport. Defaults to `#overlay-root`. */
  to?: string
}
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<SelectPortalProps>(), {
  to: '#overlay-root',
})
</script>

<template>
  <slot />
</template>
