<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'
import type { NavigationStackEntry } from './useNavigationStack'

export interface NavigationStackProps {
  /** Reactive entries array — typically `stack.entries` from
   *  `useNavigationStack()`. The top entry's `key` decides which
   *  `<NavigationPage>` is visible. */
  entries: NavigationStackEntry<any>[]
  /**
   * Direction of the last navigation, used by `<NavigationPage>` to pick its
   * enter/leave animation. `'replace'` / `'reset'` mean no animation.
   * @defaultValue 'forward'
   */
  direction?: 'forward' | 'back' | 'replace' | 'reset'
  /**
   * Transition style. `'slide'` mirrors the iOS / Material push-pop slide,
   * `'none'` is an instant swap; slide animations are CSS-driven (see
   * `NavigationPage.vue`). @defaultValue 'slide'
   */
  transition?: 'slide' | 'none'
}

/**
 * Context provided to descendant `<NavigationPage>` components so each page can
 * decide whether it's mounted and which animation phase to play, instead of
 * prop-drilling the stack state through every page slot.
 */
export interface NavigationStackContext {
  currentKey: Ref<string | undefined>
  direction: Ref<'forward' | 'back' | 'replace' | 'reset'>
  transition: Ref<'slide' | 'none'>
}

export const [injectNavigationStackContext, provideNavigationStackContext]
  = createContext<NavigationStackContext>('NavigationStack')
</script>

<script setup lang="ts">
import { computed, toRefs, ref, watch } from 'vue'

const props = withDefaults(defineProps<NavigationStackProps>(), {
  direction: 'forward',
  transition: 'slide',
})

const { direction, transition } = toRefs(props)

const currentKey = computed(() => {
  const last = props.entries[props.entries.length - 1]
  return last?.key
})

// Surface direction as a mutable ref so children can read it during their own
// transition lifecycle.
const directionRef = ref(direction.value)
watch(direction, (next) => { directionRef.value = next })

provideNavigationStackContext({
  currentKey,
  direction: directionRef,
  transition,
})

defineSlots<{ default?: () => any }>()
</script>

<template>
  <view
    class="vyui-nav-stack"
    :style="{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }"
  >
    <slot />
  </view>
</template>
