<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/chip'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.chip`.
 */
export const buildChip = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).chip as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type ChipVariants = VariantProps<ReturnType<typeof buildChip>>

export interface ChipProps {
  color?: ChipVariants['color']
  size?: ChipVariants['size']
  /** Corner the chip is anchored to. Defaults to `top-right`. */
  position?: ChipVariants['position']
  /** When `true`, keep the chip inside the wrapped element (no edge nudge). */
  inset?: boolean
  /** When `true`, render the dot without the relative wrapper (no overlay). */
  standalone?: boolean
  /** Optional text/count rendered inside the chip — turns the dot into a pill. */
  text?: string | number
  /** Hide the chip itself; the wrapped child still renders. Defaults to `true`. */
  show?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildChip>['slots'], any>>
}

export interface ChipSlots {
  default(props?: {}): any
  content(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<ChipProps>(), {
  inset: false,
  standalone: false,
  show: true,
})
defineSlots<ChipSlots>()
const slots = useSlots()

const appConfig = useAppConfig()

const hasContent = computed(() => !!slots.content || props.text !== undefined && props.text !== null)

const ui = computed(() => buildChip(appConfig)({
  color: props.color,
  size: props.size,
  position: props.position,
  inset: props.inset,
  standalone: props.standalone,
  hasContent: hasContent.value,
}))
</script>

<template>
  <template v-if="standalone">
    <view v-if="show" :class="ui.base({ class: [props.class, props.ui?.base] })">
      <slot name="content">
        <text v-if="hasContent">{{ props.text }}</text>
      </slot>
    </view>
  </template>
  <view v-else :class="ui.root({ class: [props.class, props.ui?.root] })">
    <slot />
    <view v-if="show" :class="ui.base({ class: props.ui?.base })">
      <slot name="content">
        <text v-if="hasContent">{{ props.text }}</text>
      </slot>
    </view>
  </view>
</template>
