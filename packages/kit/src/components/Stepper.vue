<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/stepper'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.stepper`.
 */
export const buildStepper = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).stepper as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
})

type StepperVariants = VariantProps<ReturnType<typeof buildStepper>>

export interface StepperItem {
  /** Step heading text. Overridden by the `title` slot when provided. */
  title?: string
  /** Sub-heading text. Overridden by the `description` slot when provided. */
  description?: string
  /** Iconify name rendered inside the step indicator. */
  icon?: string
  /** Per-item content slot name (defaults to the index when unset). */
  slot?: string
  /** Prevents this step from being selected. */
  disabled?: boolean
}

export interface StepperProps {
  items: StepperItem[]
  /** Controlled active step index. */
  modelValue?: number
  /** Initial active step index when uncontrolled. */
  defaultValue?: number
  orientation?: StepperVariants['orientation']
  /** When true, steps must be completed in order. */
  linear?: boolean
  color?: StepperVariants['color']
  size?: StepperVariants['size']
  /** Disable every step at once. */
  disabled?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildStepper>['slots'], any>>
}

export interface StepperEmits {
  (e: 'update:modelValue', value: number): void
}

type SlotProps = (props: { item: StepperItem; index: number }) => any

export interface StepperSlots {
  indicator: SlotProps
  title: SlotProps
  description: SlotProps
  [key: string]: SlotProps
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  StepperRoot,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperSeparator,
  StepperTitle,
  StepperDescription,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<StepperProps>(), {
  orientation: 'horizontal',
  linear: true,
  defaultValue: 0,
})
const emit = defineEmits<StepperEmits>()
defineSlots<StepperSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildStepper(appConfig)({
  color: props.color,
  size: props.size,
  orientation: props.orientation,
}))
</script>

<template>
  <StepperRoot
    :model-value="modelValue !== undefined ? modelValue + 1 : undefined"
    :default-value="defaultValue + 1"
    :orientation="orientation"
    :linear="linear"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="(v: number | undefined) => v !== undefined && emit('update:modelValue', v - 1)"
  >
    <view :class="ui.header({ class: props.ui?.header })">
      <StepperItem
        v-for="(item, index) in items"
        :key="index"
        :step="index + 1"
        :disabled="item.disabled || disabled"
        :class="ui.item({ class: props.ui?.item })"
      >
        <view :class="ui.container({ class: props.ui?.container })">
          <StepperTrigger :class="ui.trigger({ class: props.ui?.trigger })">
            <StepperIndicator :class="ui.indicator({ class: props.ui?.indicator })">
              <slot name="indicator" :item="item" :index="index">
                <VyIcon
                  v-if="item.icon"
                  :name="item.icon"
                  :class="ui.icon({ class: props.ui?.icon })"
                />
                <!-- `ui.icon` carries the active/completed foreground color;
                     it must sit on this <text> since color can't inherit from
                     the trigger <view> (`enableCSSInheritance: false`). -->
                <text v-else :class="ui.icon({ class: props.ui?.icon })">{{ index + 1 }}</text>
              </slot>
            </StepperIndicator>
          </StepperTrigger>
          <StepperSeparator
            v-if="index < items.length - 1"
            :class="ui.separator({ class: props.ui?.separator })"
          />
        </view>
        <view :class="ui.wrapper({ class: props.ui?.wrapper })">
          <StepperTitle :class="ui.title({ class: props.ui?.title })">
            <slot name="title" :item="item" :index="index">
              <text v-if="item.title">{{ item.title }}</text>
            </slot>
          </StepperTitle>
          <StepperDescription :class="ui.description({ class: props.ui?.description })">
            <slot name="description" :item="item" :index="index">
              <text v-if="item.description">{{ item.description }}</text>
            </slot>
          </StepperDescription>
        </view>
      </StepperItem>
    </view>
  </StepperRoot>
</template>
