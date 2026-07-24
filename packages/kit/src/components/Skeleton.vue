<script lang="ts">
import theme from '../theme/skeleton'

export interface SkeletonProps {
  class?: any
}

export interface SkeletonSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SkeletonProps>(), {})
defineSlots<SkeletonSlots>()

const { ui } = useStyledComponent('skeleton', theme, () => ({ class: props.class }))
</script>

<template>
  <view :class="ui">
    <slot />
  </view>
</template>
