<script lang="ts">
import theme from '../theme/swiper'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type SwiperTV = ThemeTV<typeof theme>
type SwiperVariants = VariantProps<SwiperTV>

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
   * Width of each item in px. When omitted, the swiper measures its container
   * and uses the available width so slides follow viewport rotation.
   */
  itemWidth?: number
  /** Navigate circularly: dragging/autoplay past the last item wraps around. */
  loop?: boolean
  /**
   * `true` enables autoplay at a default interval; a number sets the interval
   * in ms. Autoplay pauses while the user is dragging.
   */
  autoplay?: boolean | number
  /**
   * Only consume predominantly-horizontal gestures, releasing vertical drags
   * to the host scroll surface. Useful for carousels inside a vertical scroll.
   */
  axisLock?: boolean
  direction?: SwiperVariants['direction']
  size?: SwiperVariants['size']
  /** Show the fixed dot indicator strip. Opt-in. */
  showIndicators?: boolean
  class?: any
  ui?: Partial<Record<keyof SwiperTV['slots'], any>>
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
import { computed, ref, useSlots } from 'vue'
import { SwiperItem, SwiperRoot } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<SwiperProps>(), {
  direction: 'horizontal',
  showIndicators: false,
  loop: false,
  autoplay: false,
  axisLock: false,
})
const emit = defineEmits<SwiperEmits>()
defineSlots<SwiperSlots>()

const slots = useSlots()
const containerWidth = ref(0)

const { ui } = useStyledComponent('swiper', theme, () => ({
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

// `autoplay` accepts `boolean | number`: a number is the interval in ms and
// also implies autoplay is on. Split into the two core props.
const autoplayEnabled = computed(() => props.autoplay !== false && props.autoplay != null)
const autoplayInterval = computed(() => (typeof props.autoplay === 'number' ? props.autoplay : undefined))
const resolvedItemWidth = computed(() => props.itemWidth ?? (containerWidth.value || 300))

function onLayoutChange(event: { detail?: { width?: number } } | undefined) {
  const width = event?.detail?.width
  if (typeof width === 'number' && width > 0) containerWidth.value = width
}
</script>

<template>
  <view
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @layoutchange="onLayoutChange"
  >
    <SwiperRoot
      :model-value="modelValue"
      :item-width="resolvedItemWidth"
      :container-width="containerWidth || resolvedItemWidth"
      :item-count="itemCount"
      :loop="loop"
      :axis-lock="axisLock"
      :autoplay="autoplayEnabled"
      :interval="autoplayInterval"
      class="w-full"
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

      <template v-if="showIndicators && itemCount > 1" #overlay>
        <view :class="ui.indicators({ class: props.ui?.indicators })">
          <view
            v-for="i in itemCount"
            :key="i"
            :class="[
              ui.indicator({ class: props.ui?.indicator }),
              modelValue === i - 1 && ui.indicatorActive({ class: props.ui?.indicatorActive }),
            ]"
          />
        </view>
      </template>
    </SwiperRoot>
  </view>
</template>
