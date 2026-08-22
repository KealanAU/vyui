<!--
  Adapted from lynx-family/lynx-ui (Apache-2.0) —
  packages/lynx-ui-input/src/KeyboardAwareRoot.tsx.

  Owns the keyboard state: tracks which trigger is focused, and either
  translates the responder upward (`view` mode) or grows its bottom spacer and
  scrolls the scrollview (`scroll-view` mode) to keep the trigger clear of the
  on-screen keyboard.

  Keyboard signal: the focused input's per-element `@keyboard` event, piped up
  via `onAwareTriggerKeyboardChanged`. The global `keyboardstatuschanged`
  subscription is kept as a fallback but never fires under vue-lynx (see
  `Input.vue`). On web / jsdom there is no platform keyboard event, so
  `keyboardHeightInPx` stays 0 and the responder remains at rest.
-->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'

export interface KeyboardAwareRootProps extends PrimitiveProps {
  /**
   * Keep translating upward even once the focused trigger is above the
   * keyboard, so content "sticks" to the keyboard's top edge.
   */
  forceAttach?: boolean
  /**
   * Extra clearance in px between the focused field and the keyboard. A
   * `KeyboardAwareTrigger` with its own `offset` overrides this.
   */
  offset?: number
  /**
   * Combined height of the Android status bar + bottom navigation bar in px.
   * Only used when the root viewport can't be measured: `boundingClientRect`
   * does not include the status bar on Android.
   */
  androidStatusBarPlusBottomBarHeight?: number
}

export type KeyboardAwareRootEmits = {
  /**
   * Fires whenever the tracked keyboard height changes (px; `0` = hidden), so
   * wrappers can react without their own listener — e.g. `VyTray` freezes its
   * height morph while the keyboard is up.
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
 * Inlined `setNativeProps` helper. On web / jsdom the underlying element has no
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

/** Rect of a node on Lynx (`invoke('boundingClientRect')`) or web
 *  (`getBoundingClientRect`). */
async function measure(ref: KeyboardAwareNodeRef | null) {
  return useElementRect(ref?.current ?? null)
}

/** Lynx-side `scrollTo` by element id, for scrollview mode. No-op on web. */
function scrollToById(id: string, offset: number, smooth: boolean): void {
  const lynxGlobal = globalThis.lynx
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
  offset: 0,
  androidStatusBarPlusBottomBarHeight: 0,
})
const emit = defineEmits<KeyboardAwareRootEmits>()

/**
 * Distance from `bottom` (a viewport-relative rect edge) to the keyboard's
 * resting edge. Prefers the measured viewport height; falls back to the
 * screen-height math (with the Android status-bar correction).
 *
 * Assumes the LynxView's bottom edge sits at the screen bottom (true in
 * Explorer and Sparkling); a bottom-inset container would also need the gap
 * below the view subtracted.
 */
async function marginToViewportBottom(bottom: number): Promise<number> {
  const viewportHeight = await measureViewportHeight()
  if (viewportHeight > 0)
    return viewportHeight - bottom
  const { pixelHeight, pixelRatio, platform } = readSystemInfo()
  return pixelHeight / pixelRatio
    - bottom
    - (platform === 'Android' ? props.androidStatusBarPlusBottomBarHeight : 0)
}

const keyboardHeightInPx = ref(0)
const previousResponderTranslateY = ref(0)
const firstTimeFocused = ref(true)

/** The trigger ref that is currently focused — `null` when none. Shallow so the
 *  stored object keeps its identity: blur/keyboard paths compare it `===`
 *  against the reporting trigger's ref. */
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
  const sys = globalThis.SystemInfo
  return {
    pixelHeight: sys?.pixelHeight ?? 0,
    pixelRatio: sys?.pixelRatio ?? 1,
    platform: sys?.platform ?? 'Web',
  }
}

/**
 * Height of the LynxView viewport in logical px, measured from the root node.
 * `boundingClientRect` coords are viewport-relative but `SystemInfo.pixelHeight`
 * is the whole screen, so under a LynxView that doesn't fill the screen the
 * screen-based margin is inflated by the chrome above it. Resolves 0 when the
 * root query is unavailable (web / jsdom).
 */
function measureViewportHeight(): Promise<number> {
  const lynxGlobal = globalThis.lynx
  if (typeof lynxGlobal?.createSelectorQuery !== 'function')
    return Promise.resolve(0)
  return new Promise((resolve) => {
    try {
      lynxGlobal.createSelectorQuery()
        .selectRoot()
        .invoke({
          method: 'boundingClientRect',
          params: {},
          success: (res: any) => resolve(typeof res?.height === 'number' ? res.height : 0),
          fail: () => resolve(0),
        })
        .exec()
    }
    catch {
      resolve(0)
    }
  })
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
    .then(async (rect) => {
      const margin = await marginToViewportBottom(rect.bottom)
      scrollInfo.value = {
        scrollviewId,
        scrollContentId,
        dummyRef: dummyRefAtKeyboardHeight,
        marginBetweenScrollViewBottomAndScreenBottom: margin,
      }
    })
    .catch(() => {
      // On web / jsdom rect resolves to zeros — scroll-info stays unset and
      // the `transform` path is the harmless default.
    })
}

function onAwareTriggerFocused(triggerRef: KeyboardAwareNodeRef, offset?: number) {
  focusedRef.value = triggerRef
  // Triggers report their own offset; self-registered inputs report none and
  // take the root's.
  focusedOffset.value = offset ?? props.offset
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
      // Scrolling FURTHER is what buys clearance, so the offset adds to the
      // scroll target.
      scrollToById(
        scrollviewId,
        keyboardHeightInPx.value
        + focusedRect.bottom
        - responderRect.height
        + focusedOffset.value
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
    .then(async (rect) => {
      const marginBetweenInputBottomAndScreenBottom
        = await marginToViewportBottom(rect.bottom)

      // Deliberate divergence from the React port, which ADDS the offset and
      // so reduces the lift. Both vyui props document offset as extra clearance
      // above the keyboard, so it must increase the lift — subtract it.
      let translateY = marginBetweenInputBottomAndScreenBottom
        - keyboardHeightInPx.value
        + previousResponderTranslateY.value
        - focusedOffset.value

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

watch([keyboardHeightInPx, focusedRef], () => {
  adjustResponderPosition()
})

watch(keyboardHeightInPx, (h) => {
  emit('keyboardHeightChange', h)
})

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
 * Test seam: jsdom has no Lynx keyboard event, so tests force-feed a status.
 * Not part of the public component contract.
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
  /** @internal Test seam — reads the last translateY applied to the responder. */
  __test_previousTranslateY() {
    return previousResponderTranslateY.value
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
