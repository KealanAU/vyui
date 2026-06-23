<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '@/lib/vyui/theme/avatar'
import { resolveColors } from '@/lib/vyui/theme/colors'
import type { AppConfig } from '@/lib/vyui/types'
import type { ChipProps } from '@/components/vyui/Chip.vue'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.avatar`.
 */
export const buildAvatar = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).avatar as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type AvatarVariants = VariantProps<ReturnType<typeof buildAvatar>>

export interface AvatarProps {
  /** Image source URL. Renders an `<image>`; on load failure it falls back to initials/icon. */
  src?: string
  /** Accessible alt text — also used to derive initials when `text` is absent. */
  alt?: string
  /** Explicit fallback text (initials). Trumps `alt`-derived initials. */
  text?: string
  /** Iconify name shown when neither `src` nor `text` resolve to content. */
  icon?: string
  size?: AvatarVariants['size']
  color?: AvatarVariants['color']
  /**
   * Decorative chip rendered on top of the avatar. Pass `true` for the
   * default style, or a `ChipProps` object to customize color / size /
   * position / inset. Defaults to `inset: true` so it isn't clipped by the
   * avatar's `overflow-hidden` root.
   */
  chip?: boolean | ChipProps
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildAvatar>['slots'], any>>
}

export interface AvatarSlots {
  /** Replaces the entire avatar inner content. */
  default(props?: {}): any
  /** Replaces just the initials/icon fallback (no image). */
  fallback(props?: {}): any
}

/** Injection contract for `AvatarGroup` → child `Avatar` size/color propagation. */
export interface AvatarGroupContext {
  size?: AvatarVariants['size']
  color?: AvatarVariants['color']
}

import type { InjectionKey } from 'vue'
export const AVATAR_GROUP_KEY: InjectionKey<AvatarGroupContext> = Symbol('vyui:avatar-group')
</script>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useAppConfig } from '@/lib/vyui/composables/useAppConfig'
import {
  AvatarFallback as CoreAvatarFallback,
  AvatarImage as CoreAvatarImage,
  AvatarRoot as CoreAvatarRoot,
  Icon as VyIcon,
} from '@vyui/core'
import VyChip from '@/components/vyui/Chip.vue'

const props = withDefaults(defineProps<AvatarProps>(), {})
defineSlots<AvatarSlots>()

// Resolve `chip` to a `ChipProps` object (or `undefined` to skip rendering).
// Boolean `true` becomes a defaulted inset chip so it isn't clipped by the
// avatar's `overflow-hidden` root.
const resolvedChipProps = computed<ChipProps | undefined>(() => {
  if (!props.chip) return undefined
  if (props.chip === true) return { inset: true }
  return { inset: true, ...props.chip }
})

const appConfig = useAppConfig()

// AvatarGroup pushes `size`/`color` via provide() so nested avatars inherit
// the group's scale. Component-level props win when explicitly set.
const groupCtx = inject(AVATAR_GROUP_KEY, null)

const resolvedSize = computed(() => props.size ?? groupCtx?.size)
const resolvedColor = computed(() => props.color ?? groupCtx?.color)

// Derive initials from `text`, otherwise from `alt` (first letter of up to
// two words). Matches Nuxt UI v4 behaviour.
const fallbackText = computed(() => {
  if (props.text) return props.text
  if (props.alt) {
    return props.alt.split(' ').map(w => w.charAt(0)).join('').substring(0, 2)
  }
  return ''
})

const ui = computed(() => buildAvatar(appConfig)({
  size: resolvedSize.value,
  color: resolvedColor.value,
}))
</script>

<template>
  <!--
    Headless behaviour (image load-status + fallback) comes from @vyui/core's
    Avatar primitives. The Lynx `<image>` `binderror` (`@error`) handling lives
    in `CoreAvatarImage`; this wrapper only layers theming + chip overlay.
  -->
  <CoreAvatarRoot :class="[ui.root({ class: [props.class, props.ui?.root] }), chip ? 'relative' : '']">
    <slot>
      <CoreAvatarImage
        :src="src"
        :class="ui.image({ class: props.ui?.image })"
      />
      <CoreAvatarFallback>
        <slot name="fallback">
          <text
            v-if="fallbackText"
            :class="ui.text({ class: props.ui?.text })"
          >{{ fallbackText }}</text>
          <VyIcon
            v-else-if="icon"
            :name="icon"
            :class="ui.icon({ class: props.ui?.icon })"
          />
        </slot>
      </CoreAvatarFallback>
    </slot>
    <VyChip v-if="resolvedChipProps" v-bind="resolvedChipProps" />
  </CoreAvatarRoot>
</template>
