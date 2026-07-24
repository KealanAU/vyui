<script lang="ts">
import theme from '../theme/badge'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'
import type { AvatarProps } from './Avatar.vue'

type BadgeTV = ThemeTV<typeof theme>
type BadgeVariants = VariantProps<BadgeTV>

export interface BadgeProps {
  color?: BadgeVariants['color']
  variant?: BadgeVariants['variant']
  size?: BadgeVariants['size']
  /** Iconify name shown on the leading side. */
  leadingIcon?: string
  /** Iconify name shown on the trailing side. */
  trailingIcon?: string
  /**
   * Shorthand iconify name. Renders as `trailingIcon` when `trailing` is true,
   * otherwise as `leadingIcon`. Explicit `leadingIcon`/`trailingIcon` props win.
   */
  icon?: string
  /** Position flag for the `icon` shorthand (leading slot). */
  leading?: boolean
  /** Position flag for the `icon` shorthand (trailing slot). */
  trailing?: boolean
  /** Equal padding on all sides — for icon-only / avatar-only badges. */
  square?: boolean
  /**
   * Avatar to render in the leading slot. Used when there's no explicit
   * `leadingIcon`/`icon` to show.
   */
  avatar?: AvatarProps
  /** Text label. Overridden by the default slot if provided. */
  label?: string | number
  class?: any
  ui?: Partial<Record<keyof BadgeTV['slots'], any>>
}

export interface BadgeSlots {
  default(props?: {}): any
  leading(props?: {}): any
  trailing(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'
import VyAvatar from './Avatar.vue'

const props = withDefaults(defineProps<BadgeProps>(), {})
defineSlots<BadgeSlots>()

const { ui } = useStyledComponent('badge', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  square: props.square,
}))

const resolvedLeadingIcon = computed(() => {
  if (props.leadingIcon) return props.leadingIcon
  if (props.icon && !props.trailing) return props.icon
  return undefined
})
const resolvedTrailingIcon = computed(() => {
  if (props.trailingIcon) return props.trailingIcon
  if (props.icon && props.trailing) return props.icon
  return undefined
})
</script>

<template>
  <view :class="ui.base({ class: [props.class, props.ui?.base] })">
    <slot name="leading">
      <VyIcon
        v-if="resolvedLeadingIcon"
        :name="resolvedLeadingIcon"
        :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
      />
      <VyAvatar
        v-else-if="avatar && !resolvedTrailingIcon"
        v-bind="avatar"
      />
    </slot>

    <slot>
      <text v-if="label !== undefined && label !== null" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
    </slot>

    <slot name="trailing">
      <VyIcon
        v-if="resolvedTrailingIcon"
        :name="resolvedTrailingIcon"
        :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
      />
    </slot>
  </view>
</template>
