<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/swiper'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.swiper`.
 */
export const buildSwiper = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).swiper as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type SwiperVariants = VariantProps<ReturnType<typeof buildSwiper>>

export interface SwiperProps {
  /** Controlled active index. Bind with `v-model`. */
  modelValue?: number
  /**
   * Items array. When set, the wrapper renders one `SwiperItem` per entry via
   * the `item` slot. When omitted, the `default` slot is rendered as-is and
   * is expected to contain manually-placed `<SwiperItem>` children.
   */
  items?: any[]
  /**
   * Width of each item in px. Required by the core primitive — items snap on
   * multiples of this width.
   */
  itemWidth?: number
  /**
   * Reserved for future core support. Accepted on the wrapper for forward
   * compatibility; ignored today.
   */
  loop?: boolean
  /**
   * Reserved for future core support. `true` enables autoplay at a default
   * interval, a number sets the interval in ms. Ignored today.
   */
  autoplay?: boolean | number
  direction?: SwiperVariants['direction']
  size?: SwiperVariants['size']
  /** Show the dot indicator strip. */
  showIndicators?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildSwiper>['slots'], any>>
}

export interface SwiperEmits {
  (e: 'update:modelValue', value: number): void
}

export interface SwiperSlots {
  default(props?: {}): any
  item(props: { item: any, index: number }): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { SwiperItem, SwiperRoot } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<SwiperProps>(), {
  itemWidth: 300,
  direction: 'horizontal',
  showIndicators: true,
})
const emit = defineEmits<SwiperEmits>()
defineSlots<SwiperSlots>()

const appConfig = useAppConfig()
const slots = useSlots()

const ui = computed(() => buildSwiper(appConfig)({
  direction: props.direction,
  size: props.size,
}))

// Core requires `itemCount`. Derive from `items` when provided; otherwise
// fall back to the default slot's rendered child count.
const itemCount = computed(() => {
  if (props.items) return props.items.length
  const nodes = slots.default?.() ?? []
  return nodes.length
})
</script>

<template>
  <SwiperRoot
    :model-value="modelValue"
    :item-width="itemWidth"
    :item-count="itemCount"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template v-if="items">
      <SwiperItem
        v-for="(it, index) in items"
        :key="index"
        :class="ui.item({ class: props.ui?.item })"
      >
        <slot name="item" :item="it" :index="index" />
      </SwiperItem>
    </template>
    <slot v-else />

    <view
      v-if="showIndicators && items && items.length > 1"
      :class="ui.indicators({ class: props.ui?.indicators })"
    >
      <view
        v-for="(_, i) in items"
        :key="i"
        :class="[
          ui.indicator({ class: props.ui?.indicator }),
          modelValue === i && ui.indicatorActive({ class: props.ui?.indicatorActive }),
        ]"
      />
    </view>
  </SwiperRoot>
</template>
