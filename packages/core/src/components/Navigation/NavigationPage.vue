<script lang="ts">
export interface NavigationPageProps {
  /** Stable identifier for this page. Must match the `key` of a stack entry for
   *  the page to mount. */
  pageKey: string
  /** When `false`, force-unmount even if this page matches the current stack key
   *  — for memory pressure or a screen-specific reset. @defaultValue true */
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
 * Slide-in animation class for the current page, reusing the Lynx preset's named
 * `slide-in` keyframe. Both push and pop apply the same enter animation; there
 * is no distinct leave/back animation yet.
 *
 * Animations are CSS — no MT worklet — so the page renders absolute and the
 * layout engine handles the transform.
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
