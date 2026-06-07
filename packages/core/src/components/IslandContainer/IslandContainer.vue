<!-- vyui original component — not part of reka-ui. -->
<script lang="ts">
import type { AsTag } from '@/components/Primitive'

/**
 * Generic visual + layout wrapper for "island" UI — pill / panel surfaces
 * with a soft border, glassy background, and elevation. Intentionally
 * unopinionated about placement; the parent positions it via the `class` prop.
 *
 * Lynx note: `as` defaults to `view` (Lynx layout tag), not `div`. Pass any
 * Lynx tag (`view`, `scroll-view`, `overlay`, …) or a Vue component to
 * change the semantic shell.
 */
export interface IslandContainerProps {
  /**
   * Element this container renders as. Defaults to `view` (Lynx layout tag).
   * Use a different tag/component when you need different semantic intent
   * (e.g. wrap in a custom navigation component).
   * @defaultValue `'view'`
   */
  as?: AsTag
  /**
   * Extra utility classes — merged onto the baseline via `tailwind-merge`.
   * Caller classes win on conflict (e.g. pass `rounded-none` to drop the
   * default radius, or `bg-black/60 text-white` for a dark island).
   */
  class?: string | string[]
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { twMerge } from 'tailwind-merge'

const props = withDefaults(defineProps<IslandContainerProps>(), {
  as: 'view',
})

defineSlots<{
  default?: () => any
}>()

// Baseline island aesthetic. Position is intentionally absent — the parent
// supplies it via `class` (e.g. `fixed top-2 left-2`, `sticky bottom-0`,
// inline inside a flex row). `tailwind-merge` lets callers override any
// individual baseline token (radius, padding, surface, border, shadow).
const BASE
  = 'flex flex-row items-center gap-2 px-4 py-2 '
    + 'rounded-2xl bg-white/70 backdrop-blur-xl '
    + 'border border-black/5 shadow-lg shadow-black/10'

const mergedClass = computed(() =>
  twMerge(
    BASE,
    Array.isArray(props.class) ? props.class.join(' ') : props.class,
  ),
)
</script>

<template>
  <component :is="as" :class="mergedClass">
    <slot />
  </component>
</template>
