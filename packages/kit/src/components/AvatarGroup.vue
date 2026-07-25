<script lang="ts">
import theme from '../theme/avatarGroup'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type AvatarGroupTV = ThemeTV<typeof theme>
type AvatarGroupVariants = VariantProps<AvatarGroupTV>

export interface AvatarGroupProps {
  size?: AvatarGroupVariants['size']
  color?: AvatarGroupVariants['color']
  /** Maximum visible avatars before collapsing into a `+N` overflow chip. */
  max?: number | string
  class?: any
  ui?: Partial<Record<keyof AvatarGroupTV['slots'], any>>
}

export interface AvatarGroupSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, provide, useSlots, type VNode } from 'vue'
import { useStyledComponent } from '../composables/useStyledComponent'
import VyAvatar, { AVATAR_GROUP_KEY } from './Avatar.vue'

const props = withDefaults(defineProps<AvatarGroupProps>(), {})
defineSlots<AvatarGroupSlots>()

const slots = useSlots()

const { ui } = useStyledComponent('avatarGroup', theme, () => ({
  size: props.size,
  color: props.color,
}))

const max = computed(() => typeof props.max === 'string' ? Number.parseInt(props.max, 10) : props.max)

// Walk the default slot, peeling open fragments / commented nodes so consumers
// can use `v-for` / `v-if` inside `<VyAvatarGroup>`. Mirrors Nuxt UI v4 logic.
const children = computed<VNode[]>(() => {
  let nodes = slots.default?.() as VNode[] | undefined
  if (nodes?.length) {
    nodes = nodes.flatMap((child: any) => {
      if (typeof child.type === 'symbol') {
        if (typeof child.children === 'string') return []
        return (child.children as VNode[]) || []
      }
      return child
    }).filter(Boolean) as VNode[]
  }
  return nodes || []
})

const visibleAvatars = computed<VNode[]>(() => {
  if (!children.value.length) return []
  if (!max.value || max.value <= 0) return [...children.value].reverse()
  return [...children.value].slice(0, max.value).reverse()
})

const hiddenCount = computed(() => {
  if (!children.value.length) return 0
  return children.value.length - visibleAvatars.value.length
})

// Propagate group size/color so nested `VyAvatar`s inherit the scale when
// they don't override it themselves.
provide(AVATAR_GROUP_KEY, computed(() => ({
  size: props.size,
  color: props.color,
})) as any)
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <VyAvatar
      v-if="hiddenCount > 0"
      :text="`+${hiddenCount}`"
      :class="ui.base({ class: props.ui?.base })"
    />
    <component
      :is="avatar"
      v-for="(avatar, count) in visibleAvatars"
      :key="count"
      :class="ui.base({ class: props.ui?.base })"
    />
  </view>
</template>
