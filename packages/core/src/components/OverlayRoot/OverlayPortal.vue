<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Renders its slot through the app-root `<OverlayRoot>` instead of in place,
     so overlay content escapes an ancestor's `overflow: hidden` (Lynx has no
     `<Teleport>`). Mount/unmount IS the register/unregister — wrap this in
     `<Presence>` and the leaving animation still plays. Requires an
     `<OverlayRoot />` at the app root (`<VyApp>` mounts one). -->
<script setup lang="ts">
import { getCurrentInstance, onUnmounted, useSlots } from 'vue'
import { useId } from '@/shared'
import { registerOverlay, unregisterOverlay } from './overlayStore'

const slots = useSlots()
const id = useId()
// The provides chain is captured here and re-provided by OverlayRoot's
// ContextBridge, so `inject()` inside the slot still resolves despite rendering
// outside this subtree.
const capturedProvides = (getCurrentInstance() as
  | { provides?: Record<any, any> }
  | null)?.provides

registerOverlay(id, () => slots.default?.(), capturedProvides)
onUnmounted(() => unregisterOverlay(id))
</script>

<template>
  <!-- slot is painted through the app-root <OverlayRoot> -->
</template>
