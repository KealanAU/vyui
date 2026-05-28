<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/card'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.card`.
 */
export const buildCard = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).card as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type CardVariants = VariantProps<ReturnType<typeof buildCard>>

export interface CardProps {
  variant?: CardVariants['variant']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildCard>['slots'], any>>
}

export interface CardSlots {
  header(props?: {}): any
  default(props?: {}): any
  footer(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<CardProps>(), {})
defineSlots<CardSlots>()
const slots = useSlots()

const appConfig = useAppConfig()

const ui = computed(() => buildCard(appConfig)({
  variant: props.variant,
}))
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <view v-if="!!slots.header" :class="ui.header({ class: props.ui?.header })">
      <slot name="header" />
    </view>
    <view v-if="!!slots.default" :class="ui.body({ class: props.ui?.body })">
      <slot />
    </view>
    <view v-if="!!slots.footer" :class="ui.footer({ class: props.ui?.footer })">
      <slot name="footer" />
    </view>
  </view>
</template>
