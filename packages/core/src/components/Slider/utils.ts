import type { ComputedRef } from 'vue'
import { clamp, createContext } from '@/shared'

export interface SliderOrientationPrivateProps {
  min: number
  max: number
  inverted: boolean
}

export function convertValueToPercentage(value: number, min: number, max: number) {
  const maxSteps = max - min
  const percentPerStep = 100 / maxSteps
  const percentage = percentPerStep * (value - min)
  return clamp(percentage, 0, 100)
}

/** Returns a label for each thumb when there are two or more thumbs */
export function getLabel(index: number, totalValues: number) {
  if (totalValues > 2)
    return `Value ${index + 1} of ${totalValues}`

  else if (totalValues === 2)
    return ['Minimum', 'Maximum'][index]

  else
    return undefined
}

/**
 * Gets an array of steps between each value.
 *
 * @example
 * // returns [1, 9]
 * getStepsBetweenValues([10, 11, 20]);
 */
function getStepsBetweenValues(values: number[]) {
  return values.slice(0, -1).map((value, index) => values[index + 1] - value)
}

/**
 * Verifies the minimum steps between all values is greater than or equal
 * to the expected minimum steps.
 *
 * @example
 * // returns false
 * hasMinStepsBetweenValues([1,2,3], 2);
 *
 * @example
 * // returns true
 * hasMinStepsBetweenValues([1,2,3], 1);
 */
export function hasMinStepsBetweenValues(values: number[], minStepsBetweenValues: number) {
  if (minStepsBetweenValues > 0) {
    const stepsBetweenValues = getStepsBetweenValues(values)
    const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues)
    return actualMinStepsBetweenValues >= minStepsBetweenValues
  }
  return true
}

type Side = 'top' | 'right' | 'bottom' | 'left'
interface SliderOrientation {
  startEdge: ComputedRef<Side>
  endEdge: ComputedRef<Side>
}

export const [injectSliderOrientationContext, provideSliderOrientationContext]
  = createContext<SliderOrientation>('SliderOrientation')
