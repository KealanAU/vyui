<script lang="ts">
import type { ToggleProps as CoreToggleProps } from '@vyui/core'
import theme, { iconFg } from '../theme/toggle'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type ToggleTV = ThemeTV<typeof theme>
type ToggleVariants = VariantProps<ToggleTV>

// Extends the core primitive so `as` / `asChild` / `defaultValue` — which work
// at runtime through $attrs fall-through — get real TS/IDE support here too.
// `modelValue` / `disabled` are narrowed to the kit's concrete types.
export interface ToggleProps extends CoreToggleProps {
  modelValue?: boolean
  disabled?: boolean
  color?: ToggleVariants['color']
  variant?: ToggleVariants['variant']
  size?: ToggleVariants['size']
  /** Iconify name rendered inside the toggle when no default slot is supplied. */
  icon?: string
  class?: any
  ui?: Partial<Record<keyof ToggleTV['slots'], any>>
}

export interface ToggleEmits {
  (e: 'update:modelValue', value: boolean): void
}

export interface ToggleSlots {
  /** Pressed state and disabled flag forwarded from the core primitive. */
  default(props: {
    /** Current value */
    modelValue: boolean
    /** Current state */
    state: 'on' | 'off'
    /** Current pressed state */
    pressed: boolean
    /** Current disabled state */
    disabled: boolean
    /** Resolved hex for the current state, for custom SVG icons. */
    iconColor: string
  }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Toggle as CoreToggle, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useColorMode } from '../composables/useColorMode'
import { useStyledComponent } from '../composables/useStyledComponent'
import { resolveColorHex } from '../utils/resolveColor'

const props = withDefaults(defineProps<ToggleProps>(), {
  modelValue: false,
  disabled: false,
})
const emit = defineEmits<ToggleEmits>()
defineSlots<ToggleSlots>()

const { ui } = useStyledComponent('toggle', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  pressed: props.modelValue,
}))

const appConfig = useAppConfig()
const { isDark } = useColorMode()

// Fallbacks mirror the theme's `defaultVariants` (`primary` / `ghost`).
const iconColor = computed(() => {
  const fg = iconFg(props.color ?? 'primary', props.variant ?? 'ghost', props.modelValue, isDark.value)
  return fg === 'white' ? 'white' : resolveColorHex(appConfig, fg.semantic, fg.shade)
})
</script>

<template>
  <CoreToggle
    :model-value="modelValue"
    :disabled="disabled"
    :class="ui.base({ class: [props.class, props.ui?.base] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot
      :model-value="modelValue"
      :state="modelValue ? 'on' : 'off'"
      :pressed="modelValue"
      :disabled="disabled"
      :icon-color="iconColor"
    >
      <VyIcon v-if="icon" :name="icon" :color="iconColor" :class="ui.icon({ class: props.ui?.icon })" />
    </slot>
  </CoreToggle>
</template>
