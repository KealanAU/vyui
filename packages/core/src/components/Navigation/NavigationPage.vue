<script lang="ts">
export interface NavigationPageProps {
  /**
   * Stable identifier for this page. Must match the `key` of an entry in
   * the stack's `entries` for the page to mount.
   */
  pageKey: string
  /**
   * When `false`, force-unmount even if this page matches the current
   * stack key — useful for memory pressure or screen-specific reset.
   * @defaultValue true
   */
  keepAlive?: boolean
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { injectNavigationStackContext } from './NavigationStack.vue'

const props = withDefaults(defineProps<NavigationPageProps>(), {
  keepAlive: true,
})

const ctx = injectNavigationStackContext()

const isCurrent = computed(() => ctx.currentKey.value === props.pageKey)

/**
 * Slide direction class — picks an enter / leave animation keyed by the
 * stack's last navigation direction. Lynx's preset ships the named
 * keyframes `slide-in` / `slide-out` (used by Sheet / Toast); we reuse them
 * here. Forward push: new page slides in from the right. Back pop: page
 * slides out to the right.
 *
 * Animations are CSS — no MT worklet — so the page is rendered absolute and
 * the layout engine handles the transform. For more native-feeling physics
 * (rubber-band, swipe-back gesture) wrap individual pages in a custom MT
 * driver later.
 */
const animationClass = computed(() => {
  if (ctx.transition.value === 'none') return ''
  const dir = ctx.direction.value
  if (!isCurrent.value) return ''
  if (dir === 'forward') return 'animate-[slide-in_250ms_ease-out]'
  if (dir === 'back') return 'animate-[slide-in_250ms_ease-out]'
  return ''
})

defineSlots<{ default?: () => any }>()
</script>

<template>
  <view
    v-if="isCurrent && keepAlive"
    :class="animationClass"
    :style="{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
    }"
    :data-state="isCurrent ? 'active' : 'inactive'"
    :data-page-key="pageKey"
  >
    <slot />
  </view>
</template>
