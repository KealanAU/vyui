<script lang="ts">
import theme from '../theme/islandGroup'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type IslandGroupTV = ThemeTV<typeof theme>
type IslandGroupVariants = VariantProps<IslandGroupTV>

/**
 * Layout container for adjacent `<VyIsland>`s — pairs a main island with
 * trailing / leading companions (e.g. a Linear-style dock with a separate
 * close pill on the right; two top islands stacked left/right).
 *
 * Owns the viewport-anchored positioning so member islands can stay
 * `position="inline"` and focus on their own contents. The companion
 * island's contents are free-form — pass any `<VyIslandButton>`s,
 * indicators, mini-pills, etc.
 *
 * Usage:
 * ```vue
 * <VyIslandGroup position="bottom" size="lg">
 *   <VyIsland position="inline" size="lg">…main dock…</VyIsland>
 *   <VyIsland position="inline" size="lg">
 *     <VyIslandButton icon="…" @tap="…" />
 *   </VyIsland>
 * </VyIslandGroup>
 * ```
 *
 * `align="between"` pushes the first and last children to opposite edges
 * — useful for "breadcrumb island on the left, action island on the right"
 * at the top of the screen.
 */
export interface IslandGroupProps {
  /**
   * Placement variant. `inline` lets a parent layout own positioning.
   * @defaultValue `'inline'`
   */
  position?: IslandGroupVariants['position']
  /**
   * Stack direction. `'row'` lays members horizontally; `'col'` vertically.
   * @defaultValue `'row'`
   */
  direction?: IslandGroupVariants['direction']
  /**
   * Cross-axis alignment of the group when fixed-positioned.
   * `'between'` pins the first / last child to the edges.
   * @defaultValue `'center'`
   */
  align?: IslandGroupVariants['align']
  /**
   * Gap between member islands (and outer edge padding for `start`/`end`/
   * `between` alignment).
   * @defaultValue `'md'`
   */
  size?: IslandGroupVariants['size']
  class?: any
  ui?: Partial<Record<keyof IslandGroupTV['slots'], any>>
}

export interface IslandGroupSlots {
  default(props?: {}): any
}
</script>

<script setup lang="ts">
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<IslandGroupProps>(), {})
defineSlots<IslandGroupSlots>()

const { ui } = useStyledComponent('islandGroup', theme, () => ({
  position: props.position,
  direction: props.direction,
  align: props.align,
  size: props.size,
}))
</script>

<template>
  <view :class="ui.root({ class: [props.class, props.ui?.root] })">
    <slot />
  </view>
</template>
