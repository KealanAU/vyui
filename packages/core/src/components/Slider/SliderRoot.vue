<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { MainThreadRef } from 'vue-lynx'
import type { DataOrientation, Direction, FormFieldProps } from '@/shared/types'
import type { PrimitiveProps } from '@/components/Primitive'
import { useCollection } from '@/components/Collection'
import { createContext, useDirection, useForwardExpose } from '@/shared'

export type ThumbAlignment = 'contain' | 'overflow'

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
  thumbAlignment: Ref<ThumbAlignment>
  /** MT mirror of `currentModelValue` so worklets can compute per-thumb px. */
  valuesMT: MainThreadRef<number[]>
  /** MT mirror of `min` / `max` / `step` so worklets stay sync-only. */
  minMT: MainThreadRef<number>
  maxMT: MainThreadRef<number>
  stepMT: MainThreadRef<number>
  disabledMT: MainThreadRef<boolean>
  /** `minStepsBetweenThumbs * step` — the raw gap the worklets compare against. */
  minGapMT: MainThreadRef<number>
  /** Set by the drag worklets; gates the background's own value push. */
  draggingMT: MainThreadRef<boolean>
  /** BG callback the MTS impl invokes from a touchend worklet. */
  updateFromMT: (nextValues: number[]) => void
  commitFromMT: (nextValues: number[]) => void
}

export const [injectSliderRootContext, provideSliderRootContext]
  = createContext<SliderRootContext>('SliderRoot')
</script>

<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue'
import { runOnMainThread, useMainThreadRef } from 'vue-lynx'
import { useStandardVModel } from '@/shared/composables'
import SliderHorizontal from './SliderHorizontal.vue'
import SliderVertical from './SliderVertical.vue'
import { hasMinStepsBetweenValues } from './utils'

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

// ---------------------------------------------------------------------------
// MT bridge — the drag lives entirely in SliderImplMTS's worklets, and these
// refs are the only channel it has back to reactive state.
// ---------------------------------------------------------------------------

const valuesMT = useMainThreadRef<number[]>([...currentModelValue.value])
const minMT = useMainThreadRef<number>(props.min)
const maxMT = useMainThreadRef<number>(props.max)
const stepMT = useMainThreadRef<number>(props.step)
const disabledMT = useMainThreadRef<boolean>(props.disabled)
// Owned by SliderImplMTS's worklets for the length of a gesture.
const draggingMT = useMainThreadRef<boolean>(false)
// Pre-multiplied because `minStepsBetweenThumbs` is expressed in steps but the
// worklets compare raw values.
const minGap = computed(() => minStepsBetweenThumbs.value * step.value)
const minGapMT = useMainThreadRef<number>(minGap.value)

// Only the constructor's `INIT_MT_REF` carries a value BG -> MT; plain BG
// writes to `.current` are a silent no-op (dev-warn only). Every later sync
// therefore hops through a setter worklet — same shape as Sheet's panel
// extent. These fire from `watch` callbacks, i.e. post-mount, so they can't hit
// the setup-time dispatch race against MT-ref registration.

function _setMin(v: number) {
  'main thread'
  minMT.current = v
}

function _setMax(v: number) {
  'main thread'
  maxMT.current = v
}

function _setStep(v: number) {
  'main thread'
  stepMT.current = v
}

function _setDisabled(v: boolean) {
  'main thread'
  disabledMT.current = v
}

function _setValues(v: number[]) {
  'main thread'
  // Mid-gesture the main thread is the source of truth; this push is the echo
  // of its own live `update:modelValue` and must not stomp a newer value.
  if (draggingMT.current) return
  valuesMT.current = v
}

function _setMinGap(v: number) {
  'main thread'
  minGapMT.current = v
}

watch(() => props.min, (v) => { void runOnMainThread(_setMin as any)(v) })
watch(() => props.max, (v) => { void runOnMainThread(_setMax as any)(v) })
watch(() => props.step, (v) => { void runOnMainThread(_setStep as any)(v) })
watch(() => props.disabled, (v) => { void runOnMainThread(_setDisabled as any)(v) })
watch(currentModelValue, (v) => { void runOnMainThread(_setValues as any)([...v]) }, { deep: true })
watch(minGap, (v) => { void runOnMainThread(_setMinGap as any)(v) })

/**
 * Shared validation for values arriving from the drag worklets. They already
 * snapped to `step`, clamped to the range, kept the array sorted and honoured
 * `minStepsBetweenThumbs`, so a failure here means a stale MT mirror rather
 * than routine filtering.
 */
function isValidFromMT(nextValues: number[]): boolean {
  if (props.disabled) return false
  const prev = currentModelValue.value
  // A payload that doesn't line up with the live thumbs would clobber the
  // consumer's value with `next[0] ?? 0`.
  if (nextValues.length !== prev.length || nextValues.some(v => !Number.isFinite(v)))
    return false
  return hasMinStepsBetweenValues(nextValues, minGap.value)
}

// Value as it stood when the current gesture began. `valueCommit` compares
// against this rather than against the previous frame — the live updates below
// have already written the new value by the time the commit lands, so a
// frame-to-frame check would find nothing changed and never fire.
let valuesBeforeGesture: number[] | null = null

/**
 * Per-frame value while a drag is in flight. Emits `update:modelValue` only —
 * `valueCommit` stays a once-per-gesture signal, so consumers can still use it
 * to fire off a save.
 */
function updateFromMT(nextValues: number[]) {
  if (!isValidFromMT(nextValues)) return
  const prev = currentModelValue.value
  if (valuesBeforeGesture === null) valuesBeforeGesture = prev
  if (nextValues.some((v, i) => v !== prev[i]))
    writeModelValue(nextValues)
}

/**
 * Called from the MTS touchend worklet (via `runOnBackground`) with the final
 * snapped values — the one background round-trip per gesture.
 *
 * The worklets already snapped to `step`, clamped to the range, kept the array
 * sorted and honoured `minStepsBetweenThumbs`, so the checks below are a
 * backstop against a stale MT mirror rather than routine filtering. They must
 * stay cheap and total: a rejection here strands the MT-painted fill, which has
 * no way to learn the commit didn't land.
 */
function commitFromMT(nextValues: number[]) {
  const before = valuesBeforeGesture ?? currentModelValue.value
  valuesBeforeGesture = null
  if (!isValidFromMT(nextValues)) return
  // Two different comparisons: the write is against the CURRENT value (the live
  // updates usually got there first, so this is normally a no-op), the commit
  // against the value the gesture started from.
  const prev = currentModelValue.value
  if (nextValues.some((v, i) => v !== prev[i]))
    writeModelValue(nextValues)
  if (nextValues.some((v, i) => v !== before[i]))
    emits('valueCommit', commitShape(nextValues))
}

provideSliderRootContext({
  modelValue,
  currentModelValue,
  valueIndexToChangeRef,
  orientation,
  min,
  max,
  step,
  disabled,
  thumbAlignment,
  valuesMT,
  minMT,
  maxMT,
  stepMT,
  disabledMT,
  minGapMT,
  draggingMT,
  updateFromMT,
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
    >
      <slot :model-value="modelValue" />
    </component>
  </CollectionSlot>
</template>
