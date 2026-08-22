<script lang="ts">
import theme from '../theme/islandButton'
import type { ClassValue, ThemeTV } from '../composables/useStyledComponent'
// `IslandSize` is intentionally NOT imported here — the setup block imports it,
// and importing in both blocks raises TS2300 (the SFC compiler merges them).
// `IslandButtonVariants['size']` is structurally compatible.

type IslandButtonTV = ThemeTV<typeof theme>

/**
 * Opinionated button for use inside `<VyIsland>`. Ghost / pill styling.
 *
 * Declarative behaviors, fired in order on tap before the bubble-up `tap`:
 *  - `value` — registers this button as a "tab": auto-highlights when the
 *    parent island's `value` matches, and tap sets it.
 *  - `mode` — tap switches the parent's `mode` to this name.
 *  - `expand` — tap toggles the parent's `open`.
 *  - `reset` — tap resets the parent's `mode` to `'default'`.
 *
 * Sizing inherits from the parent `<VyIsland>` via context. Standalone use
 * works too: the behaviors no-op with no context.
 */
export interface IslandButtonProps {
  /** Iconify name shown leading the label (or alone, for icon-only). */
  icon?: string
  /** Optional text label. When set, the button morphs to a label-pill. */
  label?: string
  /** Explicit active state. Auto-overridden when `value` matches the parent
   *  island's `value`. */
  active?: boolean
  /** Disable interaction + drop visual emphasis. */
  disabled?: boolean
  /** Tab value — registers this button against the parent island's
   *  `v-model:value`, going active when the values match. */
  value?: string | number
  /**
   * Mode name — free-form string. Tap switches the parent island's mode to it;
   * pair with a `<template #[mode]>` slot defining what the row becomes.
   */
  mode?: string
  /** Tap toggles the parent island's `open` state. */
  expand?: boolean
  /** Tap resets the parent island's mode to `'default'`. */
  reset?: boolean
  /** Sizing override. Inherits the parent `<VyIsland>`'s `size` when omitted,
   *  falling back to `md` standalone. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  class?: ClassValue
  ui?: Partial<Record<keyof IslandButtonTV['slots'], ClassValue>>
}

export interface IslandButtonEmits {
  (e: 'tap'): void
}

export interface IslandButtonSlots {
  /** Override the default label slot (icon stays leading). */
  default(props?: {}): any
  /** Override the leading icon slot entirely. */
  leading(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { Button as CoreButton, Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'
import { useAppConfig } from '../composables/useAppConfig'
import { resolveColorHex } from '../utils/resolveColor'
import { injectIslandContext, type IslandSize } from './islandContext'

const props = withDefaults(defineProps<IslandButtonProps>(), {
  active: false,
  disabled: false,
  expand: false,
  reset: false,
})
const emit = defineEmits<IslandButtonEmits>()
const slots = defineSlots<IslandButtonSlots>()

// `null` so `injectIslandContext` returns null rather than throwing outside an
// `<VyIsland>` — the declarative behaviors no-op in standalone mode.
const island = injectIslandContext(null)

// Icon-only mode: no label text + no default slot content. Drives the
// `iconOnly` variant which collapses the button to a square pill.
const iconOnly = computed(() => !props.label && !slots.default)

const effectiveSize = computed<IslandSize | undefined>(
  () => props.size ?? island?.size.value,
)

// Icon pixel size per island size. The core `<VyIcon>` bakes width/height as an
// inline style (overriding any `size-*` class), so the glyph size must be passed
// as the numeric `size` prop. Values mirror `islandButton.ts`.
const ICON_PX = { sm: 16, md: 20, lg: 24, xl: 28 } as const
const iconPx = computed(() => ICON_PX[(effectiveSize.value ?? 'md') as IslandSize])

// Auto-active when this button's `value` matches the parent island's value.
// Explicit `active` prop forces it on regardless.
const effectiveActive = computed(() => {
  if (props.active) return true
  if (island && props.value !== undefined && island.value.value === props.value) return true
  return false
})

const { ui } = useStyledComponent('islandButton', theme, () => ({
  size: effectiveSize.value,
  active: effectiveActive.value,
  iconOnly: iconOnly.value,
}))

const appConfig = useAppConfig()

// Baked icon fill (see theme/iconColor.ts). Read the foreground utility back
// off the resolved slot class — consumer overrides and active-state shade
// included. Non-palette colors return `undefined`, keeping `currentColor`.
const iconColor = computed(() => {
  const cls = String(ui.value.leadingIcon({ class: props.ui?.leadingIcon }))
  if (/\btext-white\b/.test(cls)) return 'white'
  if (/\btext-black\b/.test(cls)) return 'black'
  const match = cls.match(/\btext-([a-z]+)-(\d+)\b/)
  return match ? resolveColorHex(appConfig, match[1], Number(match[2])) : undefined
})

function onTap() {
  if (props.disabled) return
  if (island) {
    if (props.value !== undefined) island.setValue(props.value)
    if (props.mode !== undefined) island.setMode(props.mode)
    if (props.expand) island.toggle()
    if (props.reset) island.resetMode()
  }
  emit('tap')
}
</script>

<template>
  <CoreButton
    :disabled="disabled"
    :data-active="effectiveActive ? 'true' : undefined"
    :class="ui.base({ class: [props.class, props.ui?.base] })"
    @tap="onTap"
  >
    <slot name="leading">
      <VyIcon
        v-if="icon"
        :name="icon"
        :size="iconPx"
        :color="iconColor"
        :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
      />
    </slot>
    <slot>
      <text v-if="label" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
    </slot>
  </CoreButton>
</template>
