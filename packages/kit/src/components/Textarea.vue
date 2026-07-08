<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/textarea'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'
import type { AvatarProps } from './Avatar.vue'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.textarea`.
 */
export const buildTextarea = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).textarea as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
})

type TextareaVariants = VariantProps<ReturnType<typeof buildTextarea>>

export interface TextareaProps {
  modelValue?: string | number
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  /** Iconify name for the spinner. Defaults to `appConfig.ui.icons.loading`. */
  loadingIcon?: string
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
  /** Iconify name shown on the leading side (wins over `icon`). */
  leadingIcon?: string
  /** Iconify name shown on the trailing side (wins over `icon`). */
  trailingIcon?: string
  /** When set, render `<VyAvatar>` in the leading slot instead of an icon. */
  avatar?: AvatarProps
  color?: TextareaVariants['color']
  variant?: TextareaVariants['variant']
  size?: TextareaVariants['size']
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  /** Visible rows. Forwarded to the underlying core `<textarea>`. */
  rows?: number
  /** Max input length. Forwarded to the underlying core `<textarea>`. */
  maxLength?: number
  /** Forwarded to the underlying `<textarea>`. */
  id?: string
  /** Forwarded to the underlying `<textarea>`. */
  name?: string
  /** Forwarded to the underlying `<textarea>`. */
  required?: boolean
  /** Focus the textarea on mount (after `autofocusDelay` ms). */
  autofocus?: boolean
  /** Delay before applying `autofocus`, in milliseconds. */
  autofocusDelay?: number
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildTextarea>['slots'], any>>
}

export interface TextareaSlots {
  /** Receives `iconColor` so custom icons can match the textarea's resolved theme color. */
  leading(props: { iconColor: string }): any
  /** Receives `iconColor` so custom icons can match the textarea's resolved theme color. */
  trailing(props: { iconColor: string }): any
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue'
import { Textarea as CoreTextarea } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { Icon as VyIcon } from '@vyui/core'
import { resolveColorHex } from '../utils/resolveColor'
import VyAvatar from './Avatar.vue'

const props = withDefaults(defineProps<TextareaProps>(), {
  rows: 3,
  autofocusDelay: 0,
})
defineEmits(['update:modelValue', 'confirm', 'focus', 'blur', 'keyboard'])
defineSlots<TextareaSlots>()

const slots = useSlots()
const appConfig = useAppConfig()

const textareaRef = ref<any>(null)

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

const hasLeading = computed(() => !!slots.leading || !!resolvedLeadingIcon.value || !!props.avatar || !!props.loading)
const hasTrailing = computed(() => !!slots.trailing || !!resolvedTrailingIcon.value)

const ui = computed(() => buildTextarea(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  loading: props.loading,
  highlight: props.highlight,
  leading: hasLeading.value,
  trailing: hasTrailing.value,
}))

// Lynx SVG can't inherit currentColor — bake the hex. Icons default to
// neutral (dimmed); override via the `leading` / `trailing` slots' `iconColor`.
const iconColor = computed(() => resolveColorHex(appConfig, 'neutral', 400))

onMounted(() => {
  if (!props.autofocus) return
  if (props.autofocusDelay > 0) {
    setTimeout(() => textareaRef.value?.focus?.(), props.autofocusDelay)
  } else {
    textareaRef.value?.focus?.()
  }
})

defineExpose({ textareaRef })
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <view
      v-if="hasLeading"
      :class="ui.leading({ class: props.ui?.leading })"
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
    </view>
    <CoreTextarea
      :ref="(el: any) => { textareaRef = el }"
      :model-value="modelValue !== undefined ? String(modelValue) : undefined"
      :placeholder="placeholder"
      :disabled="disabled"
      :id="id"
      :name="name"
      :required="required"
      :rows="rows"
      :max-length="maxLength"
      :class="ui.base({ class: props.ui?.base })"
      @update:model-value="$emit('update:modelValue', $event)"
      @confirm="$emit('confirm', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
      @keyboard="$emit('keyboard', $event)"
    />
    <view
      v-if="hasTrailing"
      :class="ui.trailing({ class: props.ui?.trailing })"
    >
      <slot name="trailing" :icon-color="iconColor">
        <VyIcon
          v-if="resolvedTrailingIcon"
          :name="resolvedTrailingIcon"
          :color="iconColor"
          :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
        />
      </slot>
    </view>
  </view>
</template>
