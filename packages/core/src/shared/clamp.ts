/**
 * Restricts a number to the `[min, max]` range.
 * @param value - the number to clamp.
 * @param min - lower bound returned when `value` is below it.
 * @param max - upper bound returned when `value` is above it.
 * @returns `value` constrained to `[min, max]`.
 */
export function clamp(value: number, min: number = Number.NEGATIVE_INFINITY, max: number = Number.POSITIVE_INFINITY): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Rounds a number to the decimal precision implied by `step`.
 * @param value - the number to round.
 * @param step - the interval whose precision drives the rounding (e.g. `0.5`).
 * @returns the value rounded to `step`'s precision.
 */
export function roundToStepPrecision(value: number, step: number) {
  let roundedValue = value
  const stepString = step.toString()
  const pointIndex = stepString.indexOf('.')
  const precision = pointIndex >= 0 ? stepString.length - pointIndex : 0
  if (precision > 0) {
    const pow = 10 ** precision
    roundedValue = Math.round(roundedValue * pow) / pow
  }
  return roundedValue
}

/**
 * Snaps a value to the nearest step within an optional `[min, max]` range.
 * @param value - the number to snap.
 * @param min - minimum bound, or `undefined` for no minimum.
 * @param max - maximum bound, or `undefined` for no maximum.
 * @param step - the interval to snap to.
 * @returns the snapped value, constrained to the range.
 */
export function snapValueToStep(value: number, min: number | undefined, max: number | undefined, step: number): number {
  min = Number(min)
  max = Number(max)
  const remainder = ((value - (Number.isNaN(min) ? 0 : min)) % step)
  let snappedValue = roundToStepPrecision(Math.abs(remainder) * 2 >= step
    ? value + Math.sign(remainder) * (step - Math.abs(remainder))
    : value - remainder, step)

  if (!Number.isNaN(min)) {
    if (snappedValue < min)
      snappedValue = min
    else if (!Number.isNaN(max) && snappedValue > max)
      snappedValue = min + Math.floor(roundToStepPrecision((max - min) / step, step)) * step
  }
  else if (!Number.isNaN(max) && snappedValue > max) {
    snappedValue = Math.floor(roundToStepPrecision(max / step, step)) * step
  }

  // correct floating point behavior by rounding to step precision
  snappedValue = roundToStepPrecision(snappedValue, step)

  return snappedValue
}

export function getDecimalCount(value: number) {
  return (String(value).split('.')[1] || '').length
}

/** Rounds a value to a fixed number of decimal places, avoiding floating-point drift. */
export function roundValue(value: number, decimalCount: number) {
  const rounder = 10 ** decimalCount
  return Math.round(value * rounder) / rounder
}
