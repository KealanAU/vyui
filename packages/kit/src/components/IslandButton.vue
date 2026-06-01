<script lang="ts">
import theme from '../theme/islandButton'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'
// NB: `IslandSize` from `./islandContext` is intentionally NOT imported here.
// The setup block below imports it; importing in both blocks raises TS2300
// "Duplicate identifier" because Vue's SFC compiler merges both `<script>`
// blocks into one module. The prop interface here uses `IslandButtonVariants['size']`
// (derived from the theme) which is structurally compatible with `IslandSize`.

type IslandButtonTV = ThemeTV<typeof theme>
type IslandButtonVariants = VariantProps<IslandButtonTV>

/**
 * Opinionated button for use inside `<VyIsland>`. Ghost / pill styling.
 *
 * Declarative behaviors (pick any combination; tap fires them in order
 * before emitting the bubble-up `tap` event):
 *
 *  - **`value`** — registers this button as a "tab". Auto-highlights when
 *    the parent island's `value` matches; tap sets the parent's value to
 *    this. Replaces the manual `:active="x === 'inbox'"` boilerplate.
 *  - **`mode`** — tap switches the parent's `mode` to this name (e.g.
 *    `mode="search"` morphs the island row to the `#search` slot).
 *  - **`expand`** — tap toggles the parent's `open` (panel expand /
 *    collapse).
 *  - **`reset`** — tap resets the parent's `mode` to `'default'` (use this
 *    on a close/cancel button inside a mode slot).
 *
 * Sizing inherits from the parent `<VyIsland>` via context. Pass an
 * explicit `size` prop to opt out.
 *
 * Standalone use (no parent island) works too — the declarative behaviors
 * just no-op when there's no context, and `size` falls back to its own
 * default.
 */
export interface IslandButtonProps {
  /** Iconify name shown leading the label (or alone, for icon-only). */
  icon?: string
  /** Optional text label. When set, the button morphs to a label-pill. */
  label?: string
  /**
   * Explicit active state. Auto-overridden when `value` matches the parent
   * island's `value`.
   */
  active?: boolean
  /** Disable interaction + drop visual emphasis. */
  disabled?: boolean
  /**
   * Tab value — registers this button against the parent island's
   * `v-model:value`. Sets active automatically when the values match.
   */
  value?: string | number
  /**
   * Mode name — free-form string. Tap switches the parent island's mode to
   * this. Pair with a `<template #[mode]>` slot on the island defining what
   * the row becomes. Common pattern names: `'fullisland'` (full takeover),
   * `'compose'`, `'filter'`, `'reply'`, … any string works.
   */
  mode?: string
  /** Tap toggles the parent island's `open` state. */
  expand?: boolean
  /** Tap resets the parent island's mode to `'default'`. */
  reset?: boolean
  /**
   * Sizing override. When omitted, the button inherits the parent
   * `<VyIsland>`'s `size`. Falls back to `md` standalone.
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  class?: any
  ui?: Partial<Record<keyof IslandButtonTV['slots'], any>>
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
import { computed, useSlots } from 'vue'
import { Button as CoreButton, Icon as VyIcon } from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'
import { injectIslandContext, type IslandSize } from './islandContext'

const props = withDefaults(defineProps<IslandButtonProps>(), {
  active: false,
  disabled: false,
  expand: false,
  reset: false,
})
const emit = defineEmits<IslandButtonEmits>()
const slots = defineSlots<IslandButtonSlots>()

// Pass `null` so `injectIslandContext` returns null rather than throwing
// when this button is used outside an `<VyIsland>` parent — declarative
// behaviors just no-op in standalone mode.
const island = injectIslandContext(null)

// Icon-only mode: no label text + no default slot content. Drives the
// `iconOnly` variant which collapses the button to a square pill.
const iconOnly = computed(() => !props.label && !slots.default)

// Effective size — explicit prop wins, otherwise inherit from the parent
// island, otherwise fall back to the theme default (`md`).
const effectiveSize = computed<IslandSize | undefined>(
  () => props.size ?? island?.size.value,
)

// Icon pixel size per island size. The core `<VyIcon>` bakes width/height as
// an inline style (overriding any `size-*` utility class), so the glyph size
// has to be passed as the numeric `size` prop — not via the theme's
// `leadingIcon` class. Values mirror the `size-*` classes in `islandButton.ts`
// (sm→16, md→20, lg→24, xl→28) for a ~40–45% icon-to-button ratio.
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
        :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
      />
    </slot>
    <slot>
      <text v-if="label" :class="ui.label({ class: props.ui?.label })">{{ label }}</text>
    </slot>
  </CoreButton>
</template>
