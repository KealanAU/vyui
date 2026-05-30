<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MainThreadRef } from 'vue-lynx'
import type { DataOrientation, Direction, ElementHandle, FormFieldProps } from '@/shared/types'
import type { PrimitiveProps } from '@/components/Primitive'
import { useCollection } from '@/components/Collection'
import { clamp, createContext, useDirection, useForwardExpose } from '@/shared'

type ThumbAlignment = 'contain' | 'overflow'

/**
 * Per-thumb registry entry the MTS impl uses to paint translate transforms
 * directly on the main thread. The element handle is captured on mount by the
 * thumb component (BG side, but `useMainThreadRef.current` is populated
 * during render so BG can read it once). `value` mirrors the current logical
 * value for that thumb, so the MT side can compute per-thumb pixel offsets
 * without crossing back to BG.
 */
export interface SliderThumbHandle {
  index: number
  elementRef: { current: any | null }
}

export interface SliderRootProps extends PrimitiveProps, FormFieldProps {
  /**
   * The value of the slider when initially rendered. Single thumb may be
   * either a `number` (e.g. `50`) or `[50]`; multi-thumb is `number[]`.
   * The slider emits `update:modelValue` (and `valueCommit`) in whichever
   * shape the input arrived in — pass `50`, get `50` back.
   */
  defaultValue?: number | number[]
  /** The controlled value of the slider. Can be bind as `v-model`. */
  modelValue?: number | number[] | null
  /** When `true`, prevents the user from interacting with the slider. */
  disabled?: boolean
  /** The orientation of the slider. */
  orientation?: DataOrientation
  /** The reading direction of the slider when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode. */
  dir?: Direction
  /** Whether the slider is visually inverted. */
  inverted?: boolean
  /** The minimum value for the range. */
  min?: number
  /** The maximum value for the range. */
  max?: number
  /** The stepping interval. */
  step?: number
  /** The minimum permitted steps between multiple thumbs. */
  minStepsBetweenThumbs?: number
  /**
   * The alignment of the slider thumb.
   * - `contain`: thumbs will be contained within the bounds of the track.
   * - `overflow`: thumbs will not be bound by the track. No extra offset will
   *   be added.
   * @defaultValue 'contain'
   */
  thumbAlignment?: ThumbAlignment
  /**
   * Drives the drag on the main thread. Defaults to on — the MT path paints
   * the active thumb directly from `touchmove` worklets so the gesture stays
   * at 60fps, and BG only sees one round-trip per gesture (a `valueCommit`
   * on `touchend`). Per-frame `update:modelValue` is suppressed during the
   * drag; consumers that need continuous updates should set this to `false`.
   *
   * Auto-disabled under vitest's dual-thread harness because the SWC worklet
   * transform isn't wired there and `:main-thread-bindtouch*` attrs crash.
   */
  mainThreadDrag?: boolean
}

export type SliderRootEmits = {
  /**
   * Event handler called when the slider value changes. Payload shape
   * mirrors the input — `number` if `modelValue` was a number, otherwise
   * `number[]`.
   */
  'update:modelValue': [payload: number | number[] | undefined]
  /**
   * Event handler called when the value changes at the end of an interaction.
   * Payload shape mirrors the input (see `update:modelValue`).
   *
   * Useful when you only need to capture a final value e.g. to update a backend service.
   */
  'valueCommit': [payload: number | number[]]
}

export interface SliderRootContext {
  orientation: Ref<DataOrientation>
  disabled: Ref<boolean>
  min: Ref<number>
  max: Ref<number>
  step: Ref<number>
  modelValue?: Readonly<Ref<number | number[] | null | undefined>>
  currentModelValue: ComputedRef<number[]>
  valueIndexToChangeRef: Ref<number>
  thumbElements: Ref<ElementHandle[]>
  thumbAlignment: Ref<ThumbAlignment>
  /** True when the MT touch pipeline owns drag paint. Set per-mount. */
  mtsEnabled: ComputedRef<boolean>
  /**
   * Per-thumb element registry the MT touch worklets read from. Populated by
   * SliderThumbImpl on mount when `mtsEnabled` is true.
   */
  thumbHandlesMT: MainThreadRef<SliderThumbHandle[]>
  /** MT mirror of `currentModelValue` so worklets can compute per-thumb px. */
  valuesMT: MainThreadRef<number[]>
  /** MT mirror of `min` / `max` / `step` so worklets stay sync-only. */
  minMT: MainThreadRef<number>
  maxMT: MainThreadRef<number>
  stepMT: MainThreadRef<number>
  disabledMT: MainThreadRef<boolean>
  /** BG callback the MTS impl invokes from a touchend worklet. */
  commitFromMT: (nextValues: number[]) => void
}

export const [injectSliderRootContext, provideSliderRootContext]
  = createContext<SliderRootContext>('SliderRoot')
</script>

<script setup lang="ts">
import { computed, ref, toRaw, toRefs, watch } from 'vue'
import { useMainThreadRef } from 'vue-lynx'
import { useStandardVModel } from '@/shared/composables'
import SliderHorizontal from './SliderHorizontal.vue'
import SliderVertical from './SliderVertical.vue'
import { getClosestValueIndex, getDecimalCount, getNextSortedValues, hasMinStepsBetweenValues, roundValue } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SliderRootProps>(), {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
  disabled: false,
  minStepsBetweenThumbs: 0,
  defaultValue: () => [0],
  inverted: false,
  thumbAlignment: 'contain',
  as: 'view',
})
const emits = defineEmits<SliderRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current slider values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { min, max, step, minStepsBetweenThumbs, orientation, disabled, thumbAlignment, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
const { forwardRef } = useForwardExpose()

const { CollectionSlot } = useCollection({ isProvider: true })

const modelValue = useStandardVModel<number | number[] | null>(props, emits)

// Normalize: a single `number` is treated as `[v]` internally so the drag /
// snap / multi-thumb code paths can stay array-based.
const currentModelValue = computed(() => {
  const v = modelValue.value
  if (typeof v === 'number') return [v]
  if (Array.isArray(v)) return [...v]
  return []
})

// Emit in whichever shape the consumer is binding with. If `modelValue` is
// (or last was) a `number`, emit the first element back as a number; if it
// was an array (or null/undefined), emit the array unchanged. Per-call
// detection so a parent that reassigns the ref shape mid-life still works.
function writeModelValue(next: number[]) {
  if (typeof modelValue.value === 'number') {
    modelValue.value = next[0] ?? 0
  }
  else {
    modelValue.value = next
  }
}

function commitShape(next: number[]): number | number[] {
  return typeof modelValue.value === 'number' ? (next[0] ?? 0) : next
}

const valueIndexToChangeRef = ref(0)
const valuesBeforeSlideStartRef = ref(currentModelValue.value)

function handleSlideStart(value: number) {
  // Snapshot the values before the gesture so `handleSlideEnd` can tell
  // whether to emit `valueCommit`. (reka-ui did this from a `@pointerdown`
  // listener on the track; Lynx fires `touchstart`, but binding it here
  // instead of on the orientation component avoids a merged array handler.)
  if (!disabled.value)
    valuesBeforeSlideStartRef.value = currentModelValue.value
  const closestIndex = getClosestValueIndex(currentModelValue.value, value)
  updateValues(value, closestIndex)
}

function handleSlideMove(value: number) {
  updateValues(value, valueIndexToChangeRef.value)
}

function handleSlideEnd() {
  const prevValue = valuesBeforeSlideStartRef.value[valueIndexToChangeRef.value]
  const nextValue = currentModelValue.value[valueIndexToChangeRef.value]
  const hasChanged = nextValue !== prevValue
  if (hasChanged)
    emits('valueCommit', commitShape(toRaw(currentModelValue.value)))
}

function updateValues(value: number, atIndex: number, { commit } = { commit: false }) {
  const decimalCount = getDecimalCount(step.value)
  const snapToStep = roundValue(Math.round((value - min.value) / step.value) * step.value + min.value, decimalCount)
  const nextValue = clamp(snapToStep, min.value, max.value)

  const nextValues = getNextSortedValues(currentModelValue.value, nextValue, atIndex)

  if (hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs.value * step.value)) {
    valueIndexToChangeRef.value = nextValues.indexOf(nextValue)
    const hasChanged = String(nextValues) !== String(currentModelValue.value)
    if (hasChanged && commit)
      emits('valueCommit', commitShape(nextValues))

    if (hasChanged) {
      // `.focus()` is a web-only a11y nicety — Lynx native thumbs are
      // LynxElement objects with no `focus` method, and calling it would
      // throw "focus is not a function" past the optional chain.
      const thumbEl = thumbElements.value[valueIndexToChangeRef.value] as any
      if (typeof thumbEl?.focus === 'function')
        thumbEl.focus()
      writeModelValue(nextValues)
    }
  }
}

const thumbElements = ref<any[]>([])

// ---------------------------------------------------------------------------
// MTS bridge — only meaningful when `mtsEnabled` is true, but the refs are
// always provided so SliderHorizontal / SliderVertical / SliderThumbImpl can
// inject the context unconditionally.
// ---------------------------------------------------------------------------

// Vitest's vue-lynx harness doesn't run the SWC worklet transform, so MT
// touch bindings would crash on render — keep MTS off there regardless of
// what the consumer asks for.
const inVitestHarness = !!(globalThis as any).lynxTestingEnv
const mtsEnabled = computed(() => {
  if (inVitestHarness) return false
  return props.mainThreadDrag !== false
})

const thumbHandlesMT = useMainThreadRef<SliderThumbHandle[]>([])
const valuesMT = useMainThreadRef<number[]>([...currentModelValue.value])
const minMT = useMainThreadRef<number>(props.min)
const maxMT = useMainThreadRef<number>(props.max)
const stepMT = useMainThreadRef<number>(props.step)
const disabledMT = useMainThreadRef<boolean>(props.disabled)

watch(() => props.min, (v) => { minMT.current = v })
watch(() => props.max, (v) => { maxMT.current = v })
watch(() => props.step, (v) => { stepMT.current = v })
watch(() => props.disabled, (v) => { disabledMT.current = v })
watch(currentModelValue, (v) => { valuesMT.current = [...v] }, { deep: true })

/**
 * Called from the MTS touchend worklet (via `runOnBackground`) with the final
 * snapped values. Pushes them through the same `valueCommit` channel the BG
 * path uses on `slideEnd`, so consumers see one commit per gesture regardless
 * of which thread drove the drag.
 */
function commitFromMT(nextValues: number[]) {
  if (props.disabled) return
  const prev = currentModelValue.value
  const changed = nextValues.length !== prev.length
    || nextValues.some((v, i) => v !== prev[i])
  if (changed) {
    writeModelValue(nextValues)
    emits('valueCommit', commitShape(nextValues))
  }
}

provideSliderRootContext({
  modelValue,
  currentModelValue,
  valueIndexToChangeRef,
  thumbElements,
  orientation,
  min,
  max,
  step,
  disabled,
  thumbAlignment,
  mtsEnabled,
  thumbHandlesMT,
  valuesMT,
  minMT,
  maxMT,
  stepMT,
  disabledMT,
  commitFromMT,
})
</script>

<template>
  <CollectionSlot>
    <component
      :is="orientation === 'horizontal' ? SliderHorizontal : SliderVertical"
      v-bind="$attrs"
      :ref="forwardRef"
      :as-child="asChild"
      :as="as"
      :min="min"
      :max="max"
      :dir="dir"
      :inverted="inverted"
      :data-disabled="disabled ? '' : undefined"
      @slide-start="!disabled && handleSlideStart($event)"
      @slide-move="!disabled && handleSlideMove($event)"
      @slide-end="!disabled && handleSlideEnd()"
    >
      <slot :model-value="modelValue" />
    </component>
  </CollectionSlot>
</template>
