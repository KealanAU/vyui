<!-- vyui original component — not part of reka-ui. -->
<script lang="ts">
import type { AsTag } from '@/components/Primitive'

/**
 * Generic visual + layout wrapper for "island" UI — pill / panel surfaces with a
 * soft border, glassy background, and elevation. Intentionally unopinionated
 * about placement; the parent positions it via the `class` prop.
 *
 * `as` defaults to `view` (a Lynx layout tag), not `div`.
 */
export interface IslandContainerProps {
  /** Element this container renders as — any Lynx tag or Vue component.
   *  @defaultValue `'view'` */
  as?: AsTag
  /** Extra utility classes, merged onto the baseline via `tailwind-merge`, so
   *  caller classes win on conflict. */
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
// supplies it via `class`, and `tailwind-merge` lets callers override any
// individual baseline token.
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
