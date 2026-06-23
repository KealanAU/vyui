<script lang="ts">
import theme, { iconFg } from '@/lib/vyui/theme/button'
import type { ThemeTV, VariantProps } from '@/lib/vyui/composables/useStyledComponent'
import type { AvatarProps } from '@/components/vyui/Avatar.vue'

type ButtonTV = ThemeTV<typeof theme>
type ButtonVariants = VariantProps<ButtonTV>

export interface ButtonProps {
  color?: ButtonVariants['color']
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  block?: boolean
  square?: boolean
  disabled?: boolean
  loading?: boolean
  /** Iconify name for the spinner. Defaults to `appConfig.ui.icons.loading`. */
  loadingIcon?: string
  /** Iconify name shown on the leading side (wins over `icon`). */
  leadingIcon?: string
  /** Iconify name shown on the trailing side (wins over `icon`). */
  trailingIcon?: string
  /**
   * Iconify shorthand. Routed to the trailing side when `trailing` is true,
   * otherwise to the leading side. Explicit `leadingIcon` / `trailingIcon`
   * always win.
   */
  icon?: string
  /** Force `icon` shorthand onto the leading side. */
  leading?: boolean
  /** Force `icon` shorthand onto the trailing side. */
  trailing?: boolean
  /** When set, render `<VyAvatar>` in the leading slot instead of an icon. */
  avatar?: AvatarProps
  /**
   * HTML button type. Kept for API parity with Nuxt UI v4 — the Vue-Lynx
   * core button renders a `<view>`, so this is currently a no-op forward.
   */
  type?: 'button' | 'submit' | 'reset'
  /**
   * Focus the button on mount. Kept for API parity with Nuxt UI v4 — the
   * Vue-Lynx core button renders a non-focusable `<view>`, so this is
   * currently a no-op.
   */
  autofocus?: boolean
  /** Text label. Overridden by the default slot if provided. */
  label?: string
  class?: any
  ui?: Partial<Record<keyof ButtonTV['slots'], any>>
}

export interface ButtonSlots {
  default(props?: {}): any
  /** Receives `iconColor` so custom icons can match the variant's resolved foreground. */
  leading(props: { iconColor: string }): any
  /** Receives `iconColor` so custom icons can match the variant's resolved foreground. */
  trailing(props: { iconColor: string }): any
}
</script>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue'
import { Button as CoreButton } from '@vyui/core'
import { useAppConfig } from '@/lib/vyui/composables/useAppConfig'
import { useStyledComponent } from '@/lib/vyui/composables/useStyledComponent'
import { Icon as VyIcon } from '@vyui/core'
import { resolveColorHex } from '@/lib/vyui/utils/resolveColor'
import VyAvatar from '@/components/vyui/Avatar.vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'button',
})
defineSlots<ButtonSlots>()
const slots = useSlots()

const appConfig = useAppConfig()

const buttonRef = ref<any>(null)

const resolvedLoadingIcon = computed(() => props.loadingIcon || appConfig.ui.icons?.loading || 'i-lucide-loader-circle')

// `icon` shorthand resolves to leading by default; flipped to trailing when
// the `trailing` boolean is set. Explicit `leadingIcon` / `trailingIcon`
// always win over the shorthand.
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

// Icon-only buttons (no label, no default slot, only an icon) collapse to
// the `square` compound variant so the padding goes from `px-3 py-2` to a
// uniform `p-2` — keeps a ghost send/x/check button visually square instead
// of stretched. Mirrors IslandButton's `iconOnly` detection. Explicit
// `square` prop wins so callers can still force it on or off.
const isIconOnly = computed(() =>
  !props.label
  && !slots.default
  && !!(resolvedLeadingIcon.value || resolvedTrailingIcon.value || props.avatar),
)

// Lynx SVG can't inherit currentColor — bake the variant's foreground into
// the icon fill at render time (same pattern as Input/Select). Fallbacks
// mirror the theme's `defaultVariants` (`primary` / `solid`).
const iconColor = computed(() => {
  const fg = iconFg(props.color ?? 'primary', props.variant ?? 'solid')
  return fg === 'white' ? 'white' : resolveColorHex(appConfig, fg.semantic, fg.shade)
})

const { ui } = useStyledComponent('button', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  block: props.block,
  square: props.square ?? isIconOnly.value,
  loading: props.loading,
}))

// `leadingAvatarSize` is a size token (not a class) carried on the theme slot
// for the active button size. Pass it to `<VyAvatar>` so an avatar shrinks with
// the button instead of rendering at the Avatar default (`md`/40px). An explicit
// `avatar.size` from the caller always wins (it's spread after via `v-bind`).
const resolvedAvatarSize = computed<AvatarProps['size']>(
  () => (props.avatar?.size ?? ui.value.leadingAvatarSize()) as AvatarProps['size'],
)

defineExpose({ buttonRef })
</script>

<template>
  <CoreButton
    :ref="(el: any) => { buttonRef = el }"
    :type="type"
    :disabled="disabled || loading"
    :class="ui.base({ class: [props.class, props.ui?.base] })"
  >
    <slot name="leading" :icon-color="iconColor">
      <VyIcon
        v-if="loading"
        :name="resolvedLoadingIcon"
        :color="iconColor"
        :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
      />
      <VyAvatar
        v-else-if="avatar"
        :size="resolvedAvatarSize"
        v-bind="avatar"
        :class="ui.leadingAvatar({ class: props.ui?.leadingAvatar })"
      />
      <VyIcon
        v-else-if="resolvedLeadingIcon"
        :name="resolvedLeadingIcon"
        :color="iconColor"
        :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
      />
    </slot>

    <slot>
      <text v-if="label" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
    </slot>

    <slot name="trailing" :icon-color="iconColor">
      <VyIcon
        v-if="resolvedTrailingIcon"
        :name="resolvedTrailingIcon"
        :color="iconColor"
        :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
      />
    </slot>
  </CoreButton>
</template>
