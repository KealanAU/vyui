<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import type { StringOrNumber } from '@/shared/types'
import { useForwardExpose } from '@/shared'

export interface TabsContentProps extends PrimitiveProps {
  /** A unique value that associates the content with a trigger. */
  value: StringOrNumber
  /** Force mounting when more control is needed — e.g. driving animation from a
   *  Vue animation library. */
  forceMount?: boolean
  /**
   * Per-panel override of the root's `unmountOnHide`. Set `true` on a panel
   * whose subtree writes styles from main-thread worklets: those writes land on
   * the native style object outside the background thread's diffing, and such
   * nodes keep painting through the kept-alive hide on device.
   */
  unmountOnHide?: boolean
}
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { injectTabsRootContext } from './TabsRoot.vue'
import { makeContentId } from './utils'

// `unmountOnHide` must default to `undefined`, not Vue's Boolean-cast `false`
// — absence means "inherit the root's setting".
const props = withDefaults(defineProps<TabsContentProps>(), {
  unmountOnHide: undefined,
})

const { forwardRef } = useForwardExpose()
const rootContext = injectTabsRootContext()
const contentId = computed(() => makeContentId(rootContext.baseId, props.value))

// Follows `contentValue`, not `modelValue`: with `deferContent` on the root
// the panel swap intentionally trails the trigger flip by one flush.
const isSelected = computed(() => props.value === rootContext.contentValue.value)

// `unmountOnHide: false` keeps a panel mounted once its tab has been visited
// (lazy, not upfront — mounting is the expensive half on Lynx); deselecting
// hides it via `display: none`. The per-panel prop wins over the root default.
const unmountOnHide = computed(() => props.unmountOnHide ?? rootContext.unmountOnHide.value)

const hasBeenSelected = ref(isSelected.value)
watch(isSelected, (selected) => {
  if (selected)
    hasBeenSelected.value = true
})

const isMounted = computed(() =>
  props.forceMount || isSelected.value
  || (!unmountOnHide.value && hasBeenSelected.value))

// Only the keep-mounted case hides itself; `forceMount` panels keep the
// existing contract where the consumer owns visibility (animation libraries).
const isKeptHidden = computed(() =>
  !isSelected.value && !props.forceMount
  && !unmountOnHide.value && hasBeenSelected.value)

// `visibility: hidden` alongside `display: none`: MT-written styles bypass the
// BG style object and can keep a node compositing through `display: none` on
// native, while visibility also reaches the compositor. Panels that OWN such
// nodes should still opt out via `unmountOnHide` — this is defence, not the
// contract.
const hiddenStyle = { display: 'none', visibility: 'hidden' } as const

onMounted(() => {
  rootContext.registerContent(props.value)
})

onBeforeUnmount(() => {
  rootContext.unregisterContent(props.value)
})
</script>

<template>
  <Primitive
    v-if="isMounted"
    :id="contentId"
    :ref="forwardRef"
    :as-child="asChild"
    :as="as"
    :data-state="isSelected ? 'active' : 'inactive'"
    :data-orientation="rootContext.orientation.value"
    :style="isKeptHidden ? hiddenStyle : undefined"
    :accessibility-elements-hidden="isKeptHidden || undefined"
  >
    <slot />
  </Primitive>
</template>
