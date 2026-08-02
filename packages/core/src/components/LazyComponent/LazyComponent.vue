<!-- Copyright 2026 The Lynx Authors. All rights reserved.
     Licensed under the Apache License Version 2.0.

     Ported from `lynx-family/lynx-ui` `packages/lynx-ui-lazy-component/src/
     index.tsx` (Apache 2.0). -->
<script lang="ts">
import type { CSSProperties } from 'vue'

export interface LazyComponentProps {
  /**
   * Logical scene name. Lynx fires `exposure` / `disexposure` events when an
   * element with `exposure-scene` enters / leaves the viewport. Components
   * sharing a scene can be referenced together.
   */
  scene: string
  /**
   * Per-instance identifier within the scene. Combined with `scene` to pick
   * the right element out of the exposure event stream.
   */
  pid: string
  /**
   * Inline styles applied to the placeholder before the component mounts.
   * Must include `width` and `height` so layout doesn't jump on mount.
   */
  estimatedStyle: CSSProperties
  /** Top margin past the viewport that still counts as visible. */
  top?: string
  /** Bottom margin past the viewport that still counts as visible. */
  bottom?: string
  /** Left margin past the viewport that still counts as visible. */
  left?: string
  /** Right margin past the viewport that still counts as visible. */
  right?: string
  /**
   * Unmount the children on `disexposure` (off-screen) and re-mount on next
   * `exposure`. The placeholder view stays mounted to preserve scroll
   * position. Defaults to `false` — once mounted, children stay mounted.
   */
  unmountOnExit?: boolean
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { Primitive } from '../Primitive'
import { useGlobalEvent } from '@/shared/composables/useGlobalEvent'

const props = withDefaults(defineProps<LazyComponentProps>(), {
  top: '10px',
  bottom: '10px',
  left: '10px',
  right: '10px',
  unmountOnExit: false,
})

const emit = defineEmits<{
  /** Fires whenever the visible state flips. Useful for demos and
   *  instrumentation; production code should rarely need it. */
  (e: 'show', visible: boolean): void
}>()

const show = ref(false)
watch(show, (value) => emit('show', value))
// Once layout has measured the mounted children at least once, retain that
// size so the placeholder doesn't collapse on `unmountOnExit` cycles.
const cachedSize = ref<{ width: string, height: string } | null>(null)

function onLayoutChange(event: any) {
  if (!show.value) return
  const detail = event?.detail
  if (!detail) return
  const { width, height } = detail
  if (typeof width === 'number' && typeof height === 'number') {
    cachedSize.value = { width: `${width}px`, height: `${height}px` }
  }
}

// Lynx exposure attrs aren't in `@lynx-js/types`'s `<view>` element typing —
// bind them through a kebab-case record so TS doesn't try to narrow each one
// against the known intrinsic prop set.
const exposureAttrs = computed<Record<string, unknown>>(() => ({
  'id': 'component',
  'flatten': false,
  'exposure-screen-margin-top': props.top,
  'exposure-screen-margin-bottom': props.bottom,
  'exposure-screen-margin-left': props.left,
  'exposure-screen-margin-right': props.right,
  'exposure-id': props.pid,
  'exposure-scene': props.scene,
}))

function matchEvent(event: unknown, scene: string, pid: string): boolean {
  const e = event as Record<string, unknown> | null
  if (!e) return false
  return e['exposure-scene'] === scene && e['exposure-id'] === pid
}

const onExposure = (...args: unknown[]) => {
  const events = args[0] as unknown[]
  if (!Array.isArray(events)) return
  for (const event of events) {
    if (matchEvent(event, props.scene, props.pid)) {
      show.value = true
      return
    }
  }
}

const onDisexposure = (...args: unknown[]) => {
  if (!props.unmountOnExit) return
  const events = args[0] as unknown[]
  if (!Array.isArray(events)) return
  for (const event of events) {
    if (matchEvent(event, props.scene, props.pid)) {
      show.value = false
      return
    }
  }
}

// `immediate`: register synchronously in setup so the listener is in place
// before Lynx can fire the first exposure event for the placeholder view.
// lynx-ui does the same via `useMemo`, which runs at render-time, not
// mount-time.
useGlobalEvent('exposure', onExposure, { immediate: true })
useGlobalEvent('disexposure', onDisexposure, { immediate: true })
</script>

<template>
  <!-- unmountOnExit: persistent placeholder, swap children on show/hide. -->
  <Primitive
    v-if="unmountOnExit"
    as="view"
    v-bind="exposureAttrs"
    class="vyui-lazy-component"
    :style="show
      ? undefined
      : {
        ...estimatedStyle,
        width: cachedSize?.width ?? (estimatedStyle as any).width,
        height: cachedSize?.height ?? (estimatedStyle as any).height,
      }"
    @layoutchange="onLayoutChange"
  >
    <slot v-if="show" />
  </Primitive>
  <!-- One-shot: render children once visible, otherwise an empty stub. -->
  <slot v-else-if="show" />
  <Primitive
    v-else
    as="view"
    v-bind="exposureAttrs"
    class="vyui-lazy-component"
    :style="estimatedStyle"
  />
</template>
