<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import type { InputConfirmType, InputType } from '@vyui/core'
import theme from '../theme/input'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'
import type { AvatarProps } from './Avatar.vue'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.input`.
 */
export const buildInput = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).input as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type InputVariants = VariantProps<ReturnType<typeof buildInput>>

export interface InputProps {
  modelValue?: string | number
  /**
   * Input mode — drives the on-screen software keyboard on native and the
   * `type` attribute on web. `'digit'` shows a pure 0-9 pad (no decimal /
   * sign), `'number'` shows the numeric keyboard with decimal, `'tel'` /
   * `'email'` give the matching layouts, `'password'` masks input.
   */
  type?: InputType
  /**
   * On-screen return-key label and behavior. Maps to iOS `returnKeyType` /
   * Android `imeOptions`. Defaults to `'done'` from the core primitive.
   * Pair with `@confirm` to handle the tap.
   */
  confirmType?: InputConfirmType
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
  color?: InputVariants['color']
  variant?: InputVariants['variant']
  size?: InputVariants['size']
  /** Paints a static ring matching `color`, ignoring focus state. */
  highlight?: boolean
  /** Forwarded to the underlying `<input>`. */
  id?: string
  /** Forwarded to the underlying `<input>`. */
  name?: string
  /** Forwarded to the underlying `<input>`. */
  required?: boolean
  /** Forwarded to the underlying `<input>`. Defaults to `'off'`. */
  autocomplete?: string
  /** Forwarded to the underlying `<input>`. Defaults to `'none'` for email and password inputs. */
  autocapitalize?: string
  /** Forwarded to the underlying `<input>`. Defaults to `'off'` for email and password inputs. */
  autocorrect?: string
  /** Focus the input on mount (after `autofocusDelay` ms). */
  autofocus?: boolean
  /** Delay before applying `autofocus`, in milliseconds. */
  autofocusDelay?: number
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildInput>['slots'], any>>
}

export interface InputSlots {
  /** Receives `iconColor` so custom icons can match the input's resolved theme color. */
  leading(props: { iconColor: string }): any
  /** Receives `iconColor` so custom icons can match the input's resolved theme color. */
  trailing(props: { iconColor: string }): any
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed, onMounted, ref, useSlots } from 'vue'
import { Input as CoreInput } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { Icon as VyIcon } from '@vyui/core'
import { resolveColorHex } from '../utils/resolveColor'
import VyAvatar from './Avatar.vue'

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  autocomplete: 'off',
  autofocusDelay: 0,
})
defineEmits(['update:modelValue', 'confirm', 'focus', 'blur', 'keyboard'])
defineSlots<InputSlots>()

const slots = useSlots()
const appConfig = useAppConfig()

const inputRef = ref<any>(null)

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

const ui = computed(() => buildInput(appConfig)({
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

const isAuthField = computed(() => props.type === 'email' || props.type === 'password')
const resolvedAutocapitalize = computed(() => props.autocapitalize ?? (isAuthField.value ? 'none' : undefined))
const resolvedAutocorrect = computed(() => props.autocorrect ?? (isAuthField.value ? 'off' : undefined))

onMounted(() => {
  if (!props.autofocus) return
  if (props.autofocusDelay > 0) {
    setTimeout(() => inputRef.value?.focus?.(), props.autofocusDelay)
  } else {
    inputRef.value?.focus?.()
  }
})

defineExpose({ inputRef })
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
    <!-- Lynx doesn't reliably honor `flex-1` on the native `<input>` tag —
         the host stays at its placeholder/content width instead of growing
         to fill the flex row. Wrapping CoreInput in a flex-1 `<view>` puts
         the grow/shrink behavior on a view (which Lynx handles correctly)
         and the inner input fills the wrapper via its own `w-full` class.
         `min-w-0` on the wrapper lets it actually shrink alongside trailing
         siblings instead of being pinned by the input's intrinsic width. -->
    <view class="flex-1 min-w-0 flex flex-row items-center">
      <CoreInput
        :ref="(el: any) => { inputRef = el }"
        :model-value="modelValue !== undefined ? String(modelValue) : undefined"
        :type="type"
        :confirm-type="confirmType"
        :placeholder="placeholder"
        :disabled="disabled"
        :id="id"
        :name="name"
        :required="required"
        :autocomplete="autocomplete"
        :autocapitalize="resolvedAutocapitalize"
        :autocorrect="resolvedAutocorrect"
        :class="ui.base({ class: ['w-full', props.ui?.base] })"
        @update:model-value="$emit('update:modelValue', $event)"
        @confirm="$emit('confirm', $event)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
        @keyboard="$emit('keyboard', $event)"
      />
    </view>
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
