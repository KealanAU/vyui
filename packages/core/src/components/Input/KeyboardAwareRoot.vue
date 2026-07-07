<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/KeyboardAwareRoot.tsx.

  Owns the keyboard state: tracks which trigger is currently focused, and
  either translates the responder upward (`view` mode) or grows the
  responder's bottom spacer + scrolls the scrollview (`scroll-view` mode) to
  keep the focused trigger above the on-screen keyboard.

  Keyboard signal: the primary source is the focused input's per-element
  `@keyboard` event, piped up via `onAwareTriggerKeyboardChanged` — the
  global `keyboardstatuschanged` subscription (`useGlobalKeyboard`) is kept
  as a fallback but never fires under vue-lynx (the event is not delivered
  to the background runtime; see `Input.vue`).

  Web / jsdom: there is no platform keyboard event, so `keyboardHeightInPx`
  stays at 0 — the responder remains at rest. The provider wiring still
  works, which is what the test suite verifies.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface KeyboardAwareRootProps extends PrimitiveProps {
  /**
   * When `true`, the responder will keep translating upward even after the
   * focused trigger is already above the keyboard. Useful for content that
   * should "stick" to the keyboard's top edge.
   */
  forceAttach?: boolean
  /**
   * Combined height of the Android status bar + bottom navigation bar in px.
   * Used to correct `boundingClientRect` (which does not include the status
   * bar on Android) when computing how far to move the responder.
   */
  androidStatusBarPlusBottomBarHeight?: number
}

export type KeyboardAwareRootEmits = {
  /**
   * Fires whenever the tracked keyboard height changes (px; `0` = hidden).
   * Lets wrappers react to keyboard visibility without their own listener —
   * e.g. `VyTray` freezes its height morph while the keyboard is up so the
   * scroll responder's growing spacer doesn't feed back into the morph.
   */
  keyboardHeightChange: [heightInPx: number]
}
</script>

<script setup lang="ts">
import { onMounted, ref, shallowRef, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useElementRect } from '@/shared/composables'
import type { KeyboardAwareKeyboardInfo, KeyboardAwareNodeRef } from './keyboardAwareContext'
import { provideKeyboardAwareRootContext } from './keyboardAwareContext'
import { useGlobalKeyboard } from './composables/useGlobalKeyboard'

/**
 * Inlined `setNativeProps` helper — vyui's worktree does not re-export the
 * upstream `setNativePropsByRef` from `@/shared`, so we implement the
 * Lynx-side bit here. On web / jsdom the underlying element has no
 * `setNativeProps`, so the call quietly no-ops.
 */
function setNativeProps(ref: KeyboardAwareNodeRef | null, props: Record<string, any>): void {
  const el: any = ref?.current
  if (!el || typeof el.setNativeProps !== 'function')
    return
  try {
    const op = el.setNativeProps(props)
    if (op && typeof op.exec === 'function')
      op.exec()
  }
  catch {
    // Swallow — best-effort native-prop write.
  }
}

/**
 * Resolve the rect of a node either on Lynx (via `useElementRect`'s native
 * `invoke('boundingClientRect')`) or on web (via `getBoundingClientRect`).
 */
async function measure(ref: KeyboardAwareNodeRef | null) {
  return useElementRect(ref?.current ?? null)
}

/**
 * Lynx-side `scrollTo` by element id — invoked when the responder runs in
 * scrollview mode. Quietly no-ops on web.
 */
function scrollToById(id: string, offset: number, smooth: boolean): void {
  const lynxGlobal: any = (globalThis as any).lynx
  if (!lynxGlobal?.createSelectorQuery)
    return
  try {
    lynxGlobal.createSelectorQuery()
      .select(`#${id}`)
      .invoke({
        method: 'scrollTo',
        params: { index: 0, offset, smooth },
        success: () => {},
        fail: () => {},
      })
      .exec()
  }
  catch {
    // Swallow.
  }
}

const props = withDefaults(defineProps<KeyboardAwareRootProps>(), {
  as: 'view',
  forceAttach: false,
  androidStatusBarPlusBottomBarHeight: 0,
})
const emit = defineEmits<KeyboardAwareRootEmits>()

const keyboardHeightInPx = ref(0)
const previousResponderTranslateY = ref(0)
const firstTimeFocused = ref(true)

/** The trigger ref that is currently focused — `null` when none. Shallow so
 *  the stored object keeps its identity: blur/keyboard paths compare it `===`
 *  against the reporting trigger's ref, and a deep `ref` would wrap plain
 *  objects (e.g. an input's self-registration ref) in a reactive proxy that
 *  never matches. */
const focusedRef = shallowRef<KeyboardAwareNodeRef | null>(null)
/** Focus-time offset captured from the focusing trigger. */
const focusedOffset = ref(0)

/** Responder ref — published to the responder via the provided context.
 *  Concrete `current` is filled in by `KeyboardAwareResponder`'s mount. */
const responderRef: KeyboardAwareNodeRef = { current: null }

/** Scrollview metadata reported by the responder when `mode="scroll-view"`. */
const scrollInfo = ref<{
  scrollviewId: string
  scrollContentId: string
  dummyRef: KeyboardAwareNodeRef
  marginBetweenScrollViewBottomAndScreenBottom: number
} | null>(null)

function readSystemInfo() {
  const sys: any = (globalThis as any).SystemInfo
  return {
    pixelHeight: sys?.pixelHeight ?? 0,
    pixelRatio: sys?.pixelRatio ?? 1,
    platform: sys?.platform ?? 'Web',
  }
}

function keyboardAwareResponderScrollInfoCollected(
  scrollviewId?: string,
  scrollContentId?: string,
  dummyRefAtKeyboardHeight?: KeyboardAwareNodeRef,
) {
  if (!scrollviewId || !scrollContentId || !dummyRefAtKeyboardHeight?.current) {
    scrollInfo.value = null
    return
  }
  // Same one-shot rect read as the React port: capture the bottom margin
  // between the responder and the screen edge once at mount.
  measure(responderRef)
    .then((rect) => {
      const { pixelHeight, pixelRatio, platform } = readSystemInfo()
      const margin = pixelHeight / pixelRatio
        - rect.bottom
        - (platform === 'Android' ? props.androidStatusBarPlusBottomBarHeight : 0)
      scrollInfo.value = {
        scrollviewId,
        scrollContentId,
        dummyRef: dummyRefAtKeyboardHeight,
        marginBetweenScrollViewBottomAndScreenBottom: margin,
      }
    })
    .catch(() => {
      // On web / jsdom rect resolves to zeros via `useElementRect`'s
      // fallback — scroll-info stays unset, and the `transform` path is the
      // harmless default.
    })
}

function onAwareTriggerFocused(triggerRef: KeyboardAwareNodeRef, offset = 0) {
  focusedRef.value = triggerRef
  focusedOffset.value = offset
}

function onAwareTriggerBlurred(triggerRef: KeyboardAwareNodeRef) {
  // 30ms delay mirrors the React port — avoids dismissing the keyboard
  // when focus is swapped between two siblings inside the same trigger.
  setTimeout(() => {
    if (focusedRef.value === triggerRef) {
      focusedRef.value = null
      focusedOffset.value = 0
    }
  }, 30)
}

function onAwareTriggerLayoutChanged(triggerRef: KeyboardAwareNodeRef) {
  if (focusedRef.value === triggerRef)
    adjustResponderPosition()
}

function onAwareTriggerKeyboardChanged(triggerRef: KeyboardAwareNodeRef, info: KeyboardAwareKeyboardInfo) {
  // A hide event from a trigger that is no longer the tracked focus is stale
  // (focus already moved to a sibling whose show event keeps the keyboard up).
  if (!info.visible && focusedRef.value && focusedRef.value !== triggerRef)
    return
  // `height` is treated as logical px — the picknic spike drove a flex spacer
  // with the raw `keyBoardHeight` on an iOS device and the sizing matched. If
  // Android reports physical pixels, divide by `SystemInfo.pixelRatio` here.
  keyboardHeightInPx.value = info.visible ? info.height : 0
}

function scrollToTarget(
  scrollviewId: string,
  _scrollContentId: string,
  offset: number,
  smooth: boolean,
) {
  const focused = focusedRef.value
  if (!focused)
    return
  Promise.all([measure(focused), measure(responderRef)])
    .then(([focusedRect, responderRect]) => {
      scrollToById(
        scrollviewId,
        keyboardHeightInPx.value
        + focusedRect.bottom
        - responderRect.height
        - focusedOffset.value
        + offset,
        smooth,
      )
    })
    .catch(() => {})
}

function doAdjustResponderTransform(
  triggerRef: KeyboardAwareNodeRef,
  transition = 'transform 0.28s',
) {
  measure(triggerRef)
    .then((rect) => {
      const { pixelHeight, pixelRatio, platform } = readSystemInfo()
      const marginBetweenInputBottomAndScreenBottom = pixelHeight / pixelRatio
        - rect.bottom
        - (platform === 'Android' ? props.androidStatusBarPlusBottomBarHeight : 0)

      let translateY = marginBetweenInputBottomAndScreenBottom
        - keyboardHeightInPx.value
        + previousResponderTranslateY.value
        + focusedOffset.value

      if (!props.forceAttach && translateY >= 0)
        translateY = 0

      setNativeProps(responderRef, {
        transform: `translateY(${translateY}px)`,
        transition,
      })
      previousResponderTranslateY.value = translateY
    })
    .catch(() => {})
}

function adjustResponderPosition() {
  const focused = focusedRef.value
  if (
    keyboardHeightInPx.value === 0
    || !responderRef.current
    || !focused
  ) {
    // Reset path — either no keyboard or nothing focused. Collapse the
    // scrollview spacer or zero out the transform, depending on mode.
    if (scrollInfo.value) {
      setNativeProps(scrollInfo.value.dummyRef, {
        height: '0px',
      })
      if (!focused)
        firstTimeFocused.value = true
    }
    else {
      setNativeProps(responderRef, {
        transform: 'translateY(0px)',
        transition: 'transform 0.2s',
      })
      previousResponderTranslateY.value = 0
    }
    return
  }

  if (scrollInfo.value) {
    const {
      scrollviewId,
      scrollContentId,
      dummyRef,
      marginBetweenScrollViewBottomAndScreenBottom,
    } = scrollInfo.value

    if (firstTimeFocused.value) {
      setNativeProps(dummyRef, {
        height: `${keyboardHeightInPx.value - marginBetweenScrollViewBottomAndScreenBottom}px`,
      })
    }
    scrollToTarget(
      scrollviewId,
      scrollContentId,
      -marginBetweenScrollViewBottomAndScreenBottom,
      true,
    )
    firstTimeFocused.value = false
  }
  else {
    doAdjustResponderTransform(focused)
  }
}

useGlobalKeyboard((status, keyboardHeight) => {
  keyboardHeightInPx.value = status === 'on' ? keyboardHeight : 0
})

// Mirror the React port's "react to either height or focus changes" effect.
watch([keyboardHeightInPx, focusedRef], () => {
  adjustResponderPosition()
})

watch(keyboardHeightInPx, (h) => {
  emit('keyboardHeightChange', h)
})

// Ensure the first paint settles the responder transform to its rest state.
onMounted(() => {
  adjustResponderPosition()
})

provideKeyboardAwareRootContext({
  onAwareTriggerFocused,
  onAwareTriggerBlurred,
  onAwareTriggerLayoutChanged,
  onAwareTriggerKeyboardChanged,
  keyboardAwareResponder: responderRef,
  keyboardAwareResponderScrollInfoCollected,
})

/**
 * Test seam: when running in jsdom there is no Lynx keyboard event, so tests
 * need to force-feed a status to verify the wiring. Exposed methods are not
 * part of the public component contract.
 */
defineExpose({
  /** @internal Test seam — forces a `keyboardstatuschanged` payload. */
  __test_setKeyboardStatus(status: 'on' | 'off', height = 320) {
    keyboardHeightInPx.value = status === 'on' ? height : 0
  },
  /** @internal Test seam — reads the currently-focused trigger ref. */
  __test_focusedRef() {
    return focusedRef.value
  },
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
  >
    <slot />
  </Primitive>
</template>
