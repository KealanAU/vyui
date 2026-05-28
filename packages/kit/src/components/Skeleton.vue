<script lang="ts">
import { tv } from 'tailwind-variants'
import theme from '../theme/skeleton'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.skeleton`.
 */
export const buildSkeleton = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).skeleton as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

export interface SkeletonProps {
  class?: any
}

export interface SkeletonSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<SkeletonProps>(), {})
defineSlots<SkeletonSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildSkeleton(appConfig))
</script>

<template>
  <view :class="ui({ class: props.class })">
    <slot />
  </view>
</template>
