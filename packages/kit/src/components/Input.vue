<script lang="ts">
import type { InputConfirmType, InputType } from '@vyui/core'
import theme from '../theme/input'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'
import type { AvatarProps } from './Avatar.vue'

type InputTV = ThemeTV<typeof theme>
type InputVariants = VariantProps<InputTV>

export interface InputProps {
  modelValue?: string | number
  /**
   * Input mode — drives the software keyboard on native and the `type`
   * attribute on web: `'digit'` is a pure 0-9 pad, `'number'` adds a decimal,
   * `'tel'` / `'email'` give matching layouts, `'password'` masks input.
   */
  type?: InputType
  /** On-screen return-key label and behavior (iOS `returnKeyType` / Android
   *  `imeOptions`), defaulting to `'done'`. Pair with `@confirm`. */
  confirmType?: InputConfirmType
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  /** Iconify name for the spinner. Defaults to `appConfig.ui.icons.loading`. */
  loadingIcon?: string
  /** Iconify shorthand, routed to the trailing side when `trailing` is set and
   *  the leading side otherwise. Explicit `leadingIcon` / `trailingIcon` win. */
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
  /** Forces the colored ring on permanently; by default it paints while focused. */
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
  /**
   * Native keyboard avoidance (Lynx `avoid-keyboard`): the platform shifts the
   * whole LynxView so the focused input clears the keyboard, with no JS. Do NOT
   * combine with a `VyKeyboardAwareRoot` — the two lifts stack. Pair with
   * `avoidKeyboardSpacing` to also clear the field's bottom chrome.
   */
  avoidKeyboard?: boolean
  /** Extra clearance in px above the keyboard when `avoidKeyboard` is set. */
  avoidKeyboardSpacing?: number
  /** Focus the input on mount (after `autofocusDelay` ms). */
  autofocus?: boolean
  /** Delay before applying `autofocus`, in milliseconds. */
  autofocusDelay?: number
  class?: ClassValue
  ui?: Partial<Record<keyof InputTV['slots'], ClassValue>>
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
import { Input as CoreInput, KeyboardAwareTrigger } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'
import { Icon as VyIcon } from '@vyui/core'
import { resolveColorHex } from '../utils/resolveColor'
import VyAvatar from './Avatar.vue'

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  autocomplete: 'off',
  autofocusDelay: 0,
})
const emit = defineEmits(['update:modelValue', 'confirm', 'focus', 'blur', 'keyboard'])
defineSlots<InputSlots>()

const slots = useSlots()
const appConfig = useAppConfig()

const inputRef = ref<any>(null)

const resolvedLoadingIcon = computed(() => props.loadingIcon || appConfig.ui.icons?.loading || 'i-lucide-loader-circle')

// `icon` shorthand resolves to leading by default, trailing when the `trailing`
// boolean is set. Explicit `leadingIcon` / `trailingIcon` always win.
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

// Lynx has no `:focus-within`, and the border/ring chrome lives on the root
// <view>, not the <input> — track focus in JS and drive the `highlight` variant.
const isFocused = ref(false)
function onFocus(event: unknown) {
  isFocused.value = true
  emit('focus', event)
}
function onBlur(event: unknown) {
  isFocused.value = false
  emit('blur', event)
}

const { ui } = useStyledComponent('input', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  loading: props.loading,
  highlight: props.highlight || isFocused.value,
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
  <!-- The trigger makes KeyboardAware lifts measure the STYLED FIELD (this root
       view — border + padding included), not the bare inner <input>. Renders
       nothing extra and no-ops without a KeyboardAwareRoot above. -->
  <KeyboardAwareTrigger as-child>
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
    <!-- Lynx doesn't reliably honor `flex-1` on the native `<input>` tag — the
         host stays at its content width. Wrapping CoreInput in a flex-1 `<view>`
         puts grow/shrink on a view (which Lynx handles) and the input fills it
         via `w-full`. `min-w-0` lets the wrapper shrink alongside trailing
         siblings. -->
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
        :avoid-keyboard="avoidKeyboard"
        :avoid-keyboard-spacing="avoidKeyboardSpacing"
        :class="ui.base({ class: ['w-full', props.ui?.base] })"
        @update:model-value="$emit('update:modelValue', $event)"
        @confirm="$emit('confirm', $event)"
        @focus="onFocus"
        @blur="onBlur"
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
  </KeyboardAwareTrigger>
</template>
