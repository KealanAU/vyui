<script lang="ts">
export interface OverlayRootProps {
  id?: string
}
</script>

<script setup lang="ts">
import { defineComponent, provide, type PropType } from 'vue'
import { overlayEntries, type OverlayEntry } from './overlayStore'

withDefaults(defineProps<OverlayRootProps>(), {
  id: 'overlay-root',
})

// Re-provides the entire provides prototype chain captured at registration time,
// so inject() inside slot content (DialogClose, AlertDialogAction, etc.) finds
// the correct context even though it renders outside the original component tree.
function collectProvides(provides: Record<any, any>): [any, any][] {
  const result: [any, any][] = []
  let current: any = provides
  while (current && current !== Object.prototype) {
    ;[
      ...Object.getOwnPropertySymbols(current),
      ...Object.getOwnPropertyNames(current),
    ].forEach((key) => {
      if (!result.some(([k]) => k === key))
        result.push([key, current[key as any]])
    })
    current = Object.getPrototypeOf(current)
  }
  return result
}

const ContextBridge = defineComponent({
  name: 'ContextBridge',
  props: {
    entry: { type: Object as PropType<OverlayEntry>, required: true },
  },
  setup(props) {
    if (props.entry.provides) {
      for (const [key, value] of collectProvides(props.entry.provides))
        provide(key, value)
    }
    return () => props.entry.render()
  },
})
</script>

<template>
  <!--
    Each entry is rendered directly — there is no shared full-screen wrapper
    `<view>`. A wrapper would be the topmost node across the whole screen and
    would swallow every touch in its empty regions, freezing the app behind a
    partial-screen overlay. Modal overlays paint their own full-screen backdrop
    child, so they still block as intended.
  -->
  <ContextBridge
    v-for="overlayEntry in overlayEntries"
    :key="overlayEntry.id"
    :entry="overlayEntry"
  />
</template>
