<script lang="ts">
import theme, { iconFg } from '../theme/alert'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type AlertTV = ThemeTV<typeof theme>
type AlertVariants = VariantProps<AlertTV>

export interface AlertProps {
  /** Title text. Overridden by the `title` slot if provided. */
  title?: string
  /** Description text. Overridden by the `description` slot if provided. */
  description?: string
  /** Iconify name shown on the leading side. */
  icon?: string
  color?: AlertVariants['color']
  variant?: AlertVariants['variant']
  /** Orientation between content and actions. */
  orientation?: AlertVariants['orientation']
  /** Show a close button to dismiss the alert. */
  close?: boolean
  /** Iconify name for the close button. Defaults to `appConfig.ui.icons.close`. */
  closeIcon?: string
  class?: any
  ui?: Partial<Record<keyof AlertTV['slots'], any>>
}

export interface AlertSlots {
  /** Receives `iconColor` so custom icons can match the variant's resolved foreground. */
  leading(props: { iconColor: string }): any
  title(props?: {}): any
  description(props?: {}): any
  actions(props?: {}): any
  /** Receives `iconColor` so custom close icons can match the variant's resolved foreground. */
  close(props: { iconColor: string }): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'
import { resolveColorHex } from '../utils/resolveColor'

const props = withDefaults(defineProps<AlertProps>(), {
  orientation: 'vertical',
})
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()
const slots = defineSlots<AlertSlots>()
const _slots = useSlots()

const appConfig = useAppConfig()

const resolvedCloseIcon = computed(() => props.closeIcon || appConfig.ui.icons?.close || 'i-lucide-x')

const hasTitle = computed(() => !!props.title || !!_slots.title)

const { ui } = useStyledComponent('alert', theme, () => ({
  color: props.color,
  variant: props.variant,
  orientation: props.orientation,
  title: hasTitle.value,
}))

// Lynx SVG can't inherit currentColor — bake the variant's foreground into
// the icon fill at render time (same pattern as Button/Input). Fallbacks
// mirror the theme's `defaultVariants` (`primary` / `solid`).
const iconColor = computed(() => {
  const fg = iconFg(props.color ?? 'primary', props.variant ?? 'solid')
  return fg === 'white' ? 'white' : resolveColorHex(appConfig, fg.semantic, fg.shade)
})

const onClose = () => emit('update:open', false)
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <slot name="leading" :icon-color="iconColor">
      <VyIcon
        v-if="icon"
        :name="icon"
        :color="iconColor"
        :class="ui.icon({ class: props.ui?.icon })"
      />
    </slot>

    <view :class="ui.wrapper({ class: props.ui?.wrapper })">
      <text
        v-if="_slots.title"
        :class="ui.title({ class: props.ui?.title })"
      >
        <slot name="title" />
      </text>
      <text
        v-else-if="title"
        :class="ui.title({ class: props.ui?.title })"
      >{{ title }}</text>
      <text
        v-if="_slots.description"
        :class="ui.description({ class: props.ui?.description })"
      >
        <slot name="description" />
      </text>
      <text
        v-else-if="description"
        :class="ui.description({ class: props.ui?.description })"
      >{{ description }}</text>
      <view
        v-if="orientation === 'vertical' && _slots.actions"
        :class="ui.actions({ class: props.ui?.actions })"
      >
        <slot name="actions" />
      </view>
    </view>

    <view
      v-if="(orientation === 'horizontal' && _slots.actions) || close"
      :class="ui.actions({ class: props.ui?.actions })"
    >
      <slot v-if="orientation === 'horizontal'" name="actions" />
      <slot name="close" :icon-color="iconColor">
        <view
          v-if="close"
          bindtap="onClose"
          :class="ui.close({ class: props.ui?.close })"
        >
          <VyIcon :name="resolvedCloseIcon" :color="iconColor" :class="ui.icon({ class: props.ui?.icon })" />
        </view>
      </slot>
    </view>
  </view>
</template>
