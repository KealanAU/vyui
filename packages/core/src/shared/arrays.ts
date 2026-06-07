import { isEqual } from 'ohash'

/**
 * Compares two arrays by length and element identity at each index.
 * @param arrayA - the first array.
 * @param arrayB - the second array.
 * @returns `true` if both arrays are equal, `false` otherwise.
 */
export function areEqual(arrayA: any[], arrayB: any[]): boolean {
  if (arrayA.length !== arrayB.length)
    return false

  for (let index = 0; index < arrayA.length; index++) {
    if (arrayA[index] !== arrayB[index])
      return false
  }

  return true
}

/**
 * Splits an array into chunks of a given size.
 * @param arr The array to split.
 * @param size The size of each chunk.
 * @returns An array of arrays, where each sub-array has `size` elements from the original array.
 * @example ```ts
 * const arr = [1, 2, 3, 4, 5, 6, 7, 8];
 * const chunks = chunk(arr, 3);
 * // chunks = [[1, 2, 3], [4, 5, 6], [7, 8]]
 * ```
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result = []
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size))

  return result
}

/**
 * Returns the inclusive subarray between the first occurrences of `start` and
 * `end`. Returns an empty array if either value is not found.
 * @param array - the array to search.
 * @param start - value marking the start of the range.
 * @param end - value marking the end of the range.
 * @returns the values between `start` and `end` (inclusive).
 */
export function findValuesBetween<T>(array: T[], start: T, end: T) {
  const startIndex = array.findIndex(i => isEqual(i, start))
  const endIndex = array.findIndex(i => isEqual(i, end))
  if (startIndex === -1 || endIndex === -1)
    return []

  const [minIndex, maxIndex] = [startIndex, endIndex].sort((a, b) => a - b)

  return array.slice(minIndex, maxIndex + 1)
}
