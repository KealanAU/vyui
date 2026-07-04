<script lang="ts">
export interface TrayViewProps {
  /**
   * Unique id for this view. The tray shows this view's content only when its
   * current `view` matches — set it via `defaultView`, `useTray().setView(id)`,
   * or a trigger's `view` prop.
   */
  id: string
}

export interface TrayViewSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectTrayContext } from './trayContext'

const props = defineProps<TrayViewProps>()
defineSlots<TrayViewSlots>()

const ctx = injectTrayContext()

// Only the active view mounts, so the tray's measuring wrapper always sees a
// single view's natural height — that measured height is what the panel morphs
// to. Unmounting inactive views also keeps their state from lingering across
// navigation (matches the reference tray).
const active = computed(() => ctx.view.value === props.id)
</script>

<template>
  <view v-if="active" data-vyui-tray-view :style="{ display: 'flex', flexDirection: 'column' }">
    <slot />
  </view>
</template>
