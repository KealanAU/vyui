<!-- Wraps Lynx's native `<list-item>` element. The `item-key` attribute MUST
     stay kebab-cased on the rendered element — Vue's template compiler
     camelizes `:itemKey` and breaks `<list>`'s diff, so we bind via the
     object form. The vyui-* attrs are devtool conveniences. -->
<script lang="ts">
export interface ListItemProps {
  /**
   * Stable unique key for this row. Required — duplicate or unstable keys
   * cause `<list>` to recycle the wrong cell.
   */
  itemKey: string
  /**
   * Optional fixed estimated height (vertical) / width (horizontal). Helps
   * Lynx allocate cells before measure.
   */
  estimatedSize?: number
}
</script>

<script setup lang="ts">
defineProps<ListItemProps>()
defineSlots<{ default?: () => any }>()
</script>

<template>
  <list-item
    class="vyui-list-item"
    data-vyui-list-item
    v-bind="estimatedSize != null
      ? { 'item-key': itemKey, 'estimated-main-axis-size-px': estimatedSize }
      : { 'item-key': itemKey }"
  >
    <slot />
  </list-item>
</template>
