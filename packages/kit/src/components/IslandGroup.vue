<script lang="ts">
import theme from '../theme/islandGroup'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type IslandGroupTV = ThemeTV<typeof theme>
type IslandGroupVariants = VariantProps<IslandGroupTV>

/**
 * Layout container for adjacent `<VyIsland>`s — pairs a main island with
 * trailing / leading companions (a Linear-style dock with a separate close pill,
 * two top islands stacked left/right, …).
 *
 * Owns the viewport-anchored positioning so member islands can stay
 * `layer="inline"` and focus on their own contents. `align="between"` pushes the
 * first and last children to opposite edges.
 */
export interface IslandGroupProps {
  /**
   * Which viewport edge to float against, when `layer !== 'inline'`. Centered
   * along the cross axis by default (tweak with `align`), via an inline `style`.
   * @defaultValue `'bottom'`
   */
  position?: IslandGroupVariants['position']
  /**
   * How the group participates in layout / stacking — the primary axis.
   *  - `overlay` — floats over page content (z-50).
   *  - `base` — floats at the viewport edge but on a low layer, so
   *    higher-tier surfaces (drawers, modals) render over it.
   *  - `inline` — sits in normal flow; a parent layout owns placement.
   *    `position` is ignored.
   * @defaultValue `'overlay'`
   */
  layer?: 'overlay' | 'base' | 'inline'
  /** Stack direction. `'row'` lays members horizontally; `'col'` vertically.
   *  @defaultValue `'row'` */
  direction?: IslandGroupVariants['direction']
  /** Cross-axis alignment when fixed-positioned; `'between'` pins the first /
   *  last child to the edges. @defaultValue `'center'` */
  align?: IslandGroupVariants['align']
  /** Gap between member islands, and outer edge padding for `start`/`end`/
   *  `between` alignment. @defaultValue `'md'` */
  size?: IslandGroupVariants['size']
  class?: ClassValue
  ui?: Partial<Record<keyof IslandGroupTV['slots'], ClassValue>>
}

export interface IslandGroupSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<IslandGroupProps>(), {
  layer: 'overlay',
})
defineSlots<IslandGroupSlots>()

const { ui } = useStyledComponent('islandGroup', theme, () => ({
  position: props.position,
  direction: props.direction,
  align: props.align,
  size: props.size,
}))

// `align` → main-axis justification, applied inline: Lynx doesn't pick up the
// tailwind `justify-*` class, so the group would hug the left edge.
const ALIGN_JUSTIFY = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
} as const satisfies Record<NonNullable<IslandGroupProps['align']>, string>

// Lynx ignores tailwind `fixed`, so a floating group is pinned via an inline
// `style`: the strip spans full-width, `justifyContent` centers the islands
// within it, `alignItems` pins them to the anchored edge. `layer="inline"`
// returns no style; `base` drops to a low z. A caller-passed `style` merges over
// this via attr fallthrough.
const positionStyle = computed(() => {
  if (props.layer === 'inline') return undefined
  const justifyContent = ALIGN_JUSTIFY[(props.align ?? 'center') as keyof typeof ALIGN_JUSTIFY]
  const zIndex = props.layer === 'base' ? 10 : 50
  if (props.position === 'top') {
    return { position: 'fixed', top: '16px', left: '0', right: '0', zIndex, justifyContent, alignItems: 'flex-start' } as const
  }
  return { position: 'fixed', bottom: '16px', left: '0', right: '0', zIndex, justifyContent, alignItems: 'flex-end' } as const
})
</script>

<template>
  <view
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    :style="positionStyle"
  >
    <slot />
  </view>
</template>
