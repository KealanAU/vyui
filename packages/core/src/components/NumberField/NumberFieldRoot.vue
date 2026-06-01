<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import type { PrimitiveProps } from '@/components/Primitive'
import { clamp, createContext, getDecimalCount, roundValue, snapValueToStep } from '@/shared'

export interface NumberFieldRootProps extends PrimitiveProps {
  /** The controlled numeric value. Pair with `@update:modelValue` (or `v-model`). `null` represents an empty field. */
  modelValue?: number | null
  /** Initial value when uncontrolled. */
  defaultValue?: number | null
  /** Minimum allowed value. Defaults to `-Infinity`. */
  min?: number
  /** Maximum allowed value. Defaults to `Infinity`. */
  max?: number
  /** Increment/decrement step and snapping granularity. Defaults to `1`. */
  step?: number
  /** When `true`, prevents the user from interacting with the field. */
  disabled?: boolean
  /** When `true`, the field renders read-only — value cannot be changed. */
  readonly?: boolean
  /** Id of the underlying input element. */
  id?: string
}

export type NumberFieldRootEmits = {
  /** v-model emit. Fires with the committed (clamped + snapped) value, or `null` when cleared. */
  'update:modelValue': [value: number | null]
}

export interface NumberFieldRootContext {
  /** Current committed value, or `null` when empty. */
  modelValue: Readonly<Ref<number | null>>
  min: Readonly<Ref<number>>
  max: Readonly<Ref<number>>
  step: Readonly<Ref<number>>
  disabled: Readonly<Ref<boolean>>
  readonly: Readonly<Ref<boolean>>
  id: Readonly<Ref<string | undefined>>
  /** `true` when the value is at (or below) `min`. */
  isAtMin: ComputedRef<boolean>
  /** `true` when the value is at (or above) `max`. */
  isAtMax: ComputedRef<boolean>
  /** Text the input should display for the current value. */
  textValue: ComputedRef<string>
  /** Increment by `step` (or `step * multiplier`), clamped + snapped. */
  increment: (multiplier?: number) => void
  /** Decrement by `step` (or `step * multiplier`), clamped + snapped. */
  decrement: (multiplier?: number) => void
  /** Parse raw text → number, clamp + snap, and commit. Empty/invalid → `null`. */
  setValue: (raw: string | number | null) => void
  /** Clamp + snap a number to the current bounds/step without committing. */
  clampSnap: (value: number) => number
}

export const [injectNumberFieldRootContext, provideNumberFieldRootContext]
  = createContext<NumberFieldRootContext>('NumberFieldRoot')

/**
 * Parse a raw string into a number. Returns `null` for empty / non-numeric
 * input (a lone `-`, `.`, or `-.` while typing also yields `null` until a
 * digit lands). Accepts an optional leading sign and a single decimal point.
 */
function parseNumber(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '')
    return null
  // Reject partial-entry tokens that `Number()` would coerce oddly.
  if (/^-?\.?$/.test(trimmed))
    return null
  const n = Number(trimmed)
  if (Number.isNaN(n) || !Number.isFinite(n))
    return null
  return n
}
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { computed, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'

const props = withDefaults(defineProps<NumberFieldRootProps>(), {
  as: 'view',
  min: Number.NEGATIVE_INFINITY,
  max: Number.POSITIVE_INFINITY,
  step: 1,
  disabled: false,
  readonly: false,
})
const emit = defineEmits<NumberFieldRootEmits>()

defineSlots<{
  default?: (props: {
    /** Current committed value, or `null` when empty. */
    modelValue: number | null
    /** Text the input displays. */
    textValue: string
  }) => any
}>()

const { min, max, step, disabled, readonly, id } = toRefs(props)
useForwardExpose()

const modelValue = useVModel(props, 'modelValue', emit, {
  defaultValue: props.defaultValue ?? null,
  passive: (props.modelValue === undefined) as false,
}) as Ref<number | null>

// Decimal precision derives from both the step and the configured min so that
// e.g. step=0.5 / min=0.25 still round-trips cleanly.
const decimalCount = computed(() =>
  Math.max(
    getDecimalCount(step.value),
    Number.isFinite(min.value) ? getDecimalCount(min.value) : 0,
  ),
)

function clampSnap(value: number): number {
  let next = clamp(value, min.value, max.value)
  // `snapValueToStep` needs finite bounds; pass `undefined` for unbounded
  // sides so it snaps to the step grid without forcing a bound.
  next = snapValueToStep(
    next,
    Number.isFinite(min.value) ? min.value : undefined,
    Number.isFinite(max.value) ? max.value : undefined,
    step.value,
  )
  return roundValue(next, decimalCount.value)
}

const isAtMin = computed(() =>
  modelValue.value != null && modelValue.value <= min.value,
)
const isAtMax = computed(() =>
  modelValue.value != null && modelValue.value >= max.value,
)

const textValue = computed(() =>
  modelValue.value == null ? '' : String(modelValue.value),
)

function commit(value: number | null) {
  if (value === modelValue.value)
    return
  modelValue.value = value
}

function setValue(raw: string | number | null) {
  if (disabled.value || readonly.value)
    return
  if (raw == null || raw === '') {
    commit(null)
    return
  }
  const parsed = typeof raw === 'number' ? raw : parseNumber(raw)
  if (parsed == null) {
    commit(null)
    return
  }
  commit(clampSnap(parsed))
}

function step_(direction: 1 | -1, multiplier = 1) {
  if (disabled.value || readonly.value)
    return
  // Stepping from an empty field starts at the nearest bound to 0, or 0 when
  // unbounded — matches typical numeric-stepper behavior.
  const base = modelValue.value
    ?? clamp(0, min.value, max.value)
  commit(clampSnap(base + direction * step.value * multiplier))
}

function increment(multiplier = 1) {
  step_(1, multiplier)
}
function decrement(multiplier = 1) {
  step_(-1, multiplier)
}

provideNumberFieldRootContext({
  modelValue,
  min,
  max,
  step,
  disabled,
  readonly,
  id,
  isAtMin,
  isAtMax,
  textValue,
  increment,
  decrement,
  setValue,
  clampSnap,
})
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    role="group"
    :data-disabled="disabled ? '' : undefined"
    :data-readonly="readonly ? '' : undefined"
  >
    <slot :model-value="modelValue" :text-value="textValue" />
  </Primitive>
</template>
