<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/KeyboardAwareResponder.tsx.

  The outer surface that physically moves to keep the focused trigger above the
  on-screen keyboard. `as="view"` (default) is a plain `<view>` whose
  `transform: translateY(...)` the root sets; `as="scroll-view"` wraps children
  in a scrollview plus a 1px dummy spacer whose height the root grows to match
  the keyboard.

  Upstream depends on `@lynx-js/lynx-ui-scroll-view`; vyui renders Lynx's native
  `<scroll-view>` directly instead, keeping the generated content-view id
  (`keyboard-aware-trigger-scroll-content-{id}`) so the root can scroll to it.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export type KeyboardAwareResponderMode = 'view' | 'scroll-view'

export interface KeyboardAwareResponderProps extends PrimitiveProps {
  /** Which underlying element to render: `'view'` (default) for a static
   *  `<view>` whose `transform` the root mutates, or `'scroll-view'` for the
   *  spacer-growing scroll path. */
  mode?: KeyboardAwareResponderMode
  /**
   * Id of the inner `<scroll-view>` when `mode === 'scroll-view'`, used by the
   * root to dispatch `scrollTo` ops. Defaults to `'scrollview'` — pass a unique
   * id when more than one scroll-mode responder can be on screen.
   */
  scrollviewId?: string
  /**
   * Class applied to the inner `<scroll-view>`. The scroll path only engages
   * when the region has a bounded height, so pass the height cap here
   * (fallthrough attrs land on the outer wrapper view).
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

/** Mirror of the React port's dummy element: a 1px-wide spacer the root grows
 *  vertically to push focused content above the keyboard. */
const dummyEl = ref<unknown>(null)
const dummyRef = ref<{ current: unknown }>({ current: null })

function syncResponderRef() {
  if (!rootContext)
    return
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
    // Clear stale scroll-info from a previous mode so the root takes the
    // `transform`-based path.
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
    <!-- `id`, not `scroll-view-id` — the root scrolls it via a `#{id}` query. -->
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
