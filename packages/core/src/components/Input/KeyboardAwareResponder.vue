<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/KeyboardAwareResponder.tsx.

  The responder is the outer surface that physically moves to keep the
  focused trigger above the on-screen keyboard. The root mutates the
  responder's native `transform` (or, in scrollview mode, scrolls a dummy
  spacer into view).

  Two modes:
   - `as="view"` (default): the responder is a plain `<view>` whose
     `transform: translateY(...)` is set by the root.
   - `as="scroll-view"`: the responder wraps its children in a scrollview and
     a 1px dummy spacer at the bottom whose height the root grows to match
     the keyboard.

  Note vs. the React port: the upstream component depends on
  `@lynx-js/lynx-ui-scroll-view`'s `<ScrollView>`. vyui has its own
  `ScrollArea` family but no straight `ScrollView`, so we render Lynx's
  native `<scroll-view>` element directly when in scrollview mode. The
  generated content-view id (`keyboard-aware-trigger-scroll-content-{id}`)
  is preserved so the root can scroll-to it by id.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export type KeyboardAwareResponderMode = 'view' | 'scroll-view'

export interface KeyboardAwareResponderProps extends PrimitiveProps {
  /**
   * Which underlying element to render. `'view'` (the default) renders a
   * static `<view>` whose `transform` the root mutates. `'scroll-view'`
   * wraps content in a `<scroll-view>` and lets the root grow a dummy
   * spacer at the bottom to push the focused trigger upward.
   */
  mode?: KeyboardAwareResponderMode
  /**
   * The id of the inner `<scroll-view>` when `mode === 'scroll-view'`. The
   * root uses this to dispatch `scrollTo` ops. Defaults to `'scrollview'`
   * for parity with the React port — pass a unique id when more than one
   * scroll-mode responder can be on screen.
   */
  scrollviewId?: string
  /**
   * Class applied to the inner `<scroll-view>` when `mode === 'scroll-view'`.
   * The scroll path only engages when the scroll region has a bounded height
   * — pass the height cap here (fallthrough attrs land on the outer wrapper
   * view, not the scroll-view).
   */
  scrollViewClass?: any
}
</script>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Primitive, usePrimitiveElement } from '@/components/Primitive'
import { injectKeyboardAwareRootContext } from './keyboardAwareContext'

const props = withDefaults(defineProps<KeyboardAwareResponderProps>(), {
  as: 'view',
  mode: 'view',
  scrollviewId: 'scrollview',
})

const { primitiveElement, currentElement } = usePrimitiveElement()
const rootContext = injectKeyboardAwareRootContext(null)

/** Mirror the React port's dummy element: a 1px-wide spacer at the bottom of
 *  the scrollview that the root grows vertically to push the focused content
 *  above the keyboard. */
const dummyEl = ref<unknown>(null)
const dummyRef = ref<{ current: unknown }>({ current: null })

function syncResponderRef() {
  if (!rootContext)
    return
  // Publish the underlying element to the root's responder ref slot.
  ;(rootContext.keyboardAwareResponder as { current: unknown }).current = currentElement.value
}

function reportScrollInfo() {
  if (!rootContext)
    return
  if (props.mode === 'scroll-view') {
    dummyRef.value.current = dummyEl.value
    rootContext.keyboardAwareResponderScrollInfoCollected(
      props.scrollviewId,
      `keyboard-aware-trigger-scroll-content-${props.scrollviewId}`,
      dummyRef.value,
    )
  }
  else {
    // Make sure stale scroll-info from a previous mode is cleared so the root
    // takes the `transform`-based path.
    rootContext.keyboardAwareResponderScrollInfoCollected(undefined, undefined, undefined)
  }
}

onMounted(() => {
  syncResponderRef()
  reportScrollInfo()
})

watch(currentElement, syncResponderRef)
watch(() => props.mode, reportScrollInfo)
</script>

<template>
  <Primitive
    v-if="mode !== 'scroll-view'"
    ref="primitiveElement"
    :as="as"
    :as-child="asChild"
    flatten="false"
  >
    <slot />
  </Primitive>

  <Primitive
    v-else
    ref="primitiveElement"
    as="view"
    flatten="false"
  >
    <!-- `id` (not `scroll-view-id`) — the root scrolls it via a `#{id}`
         selector query. -->
    <Primitive
      as="scroll-view"
      scroll-orientation="vertical"
      :id="scrollviewId"
      :class="scrollViewClass"
    >
      <Primitive
        as="view"
        :id="`keyboard-aware-trigger-scroll-content-${scrollviewId}`"
      >
        <slot />
        <Primitive
          as="view"
          :ref="(el: any) => (dummyEl = el)"
          :style="{ width: '1px' }"
        />
      </Primitive>
    </Primitive>
  </Primitive>
</template>
