<script lang="ts">
import theme from '../theme/rating'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type RatingTV = ThemeTV<typeof theme>
type RatingVariants = VariantProps<RatingTV>

export interface RatingProps {
  /** Controlled rating value. Can be bound with `v-model`. */
  modelValue?: number
  /** Total number of rating items rendered. Defaults to 5. */
  count?: number
  /** When true, all interactions are blocked. */
  disabled?: boolean
  color?: RatingVariants['color']
  size?: RatingVariants['size']
  /** Iconify name for the star glyph. Defaults to `appConfig.ui.icons.star`. */
  icon?: string
  class?: ClassValue
  ui?: Partial<Record<keyof RatingTV['slots'], ClassValue>>
}

export interface RatingEmits {
  (e: 'update:modelValue', value: number): void
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { RatingItem, RatingItemIndicator, RatingRoot, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<RatingProps>(), {
  modelValue: 0,
  count: 5,
  disabled: false,
})
const emit = defineEmits<RatingEmits>()

const appConfig = useAppConfig()

const resolvedIcon = computed(() => props.icon || appConfig.ui.icons?.star || 'i-lucide-star')

const { ui } = useStyledComponent('rating', theme, () => ({
  color: props.color,
  size: props.size,
  disabled: props.disabled,
}))
</script>

<template>
  <RatingRoot
    :model-value="modelValue"
    :length="count"
    :disabled="disabled"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <RatingItem
      v-for="i in count"
      :key="i"
      :item="i"
      :class="ui.base({ class: props.ui?.base })"
    >
      <RatingItemIndicator :step="i">
        <VyIcon :name="resolvedIcon" :class="ui.icon({ class: props.ui?.icon })" />
      </RatingItemIndicator>
    </RatingItem>
  </RatingRoot>
</template>
