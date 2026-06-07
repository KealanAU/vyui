import { isEqual } from 'ohash'
import { isNullish } from './nullish'

/**
 * Checks whether `current` equals `base`, or exists within `base` when `base`
 * is an array.
 * @param base - a single value, array of values, or `undefined`.
 * @param current - the value to compare against `base`.
 * @returns `true` if equal or present, `false` otherwise.
 */
export function isValueEqualOrExist<T>(base: T | T[] | undefined, current: T | T[] | undefined) {
  if (isNullish(base))
    return false
  if (Array.isArray(base)) {
    return base.some(val => isEqual(val, current))
  }
  else {
    return isEqual(base, current)
  }
}
