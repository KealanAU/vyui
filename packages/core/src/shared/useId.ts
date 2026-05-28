import * as vue from 'vue'
// Inspired from https://github.com/tailwindlabs/headlessui/issues/2913
// as the alternative, and a fallback for Vue version < 3.5

let count = 0
/**
 * The `useId` function generates a unique identifier using a provided deterministic ID or a default
 * one prefixed with "vy-".
 * @param {string | null | undefined} [deterministicId] - The `useId` function you provided takes an
 * optional parameter `deterministicId`, which can be a string, null, or undefined. If
 * `deterministicId` is provided, the function will return it. Otherwise, it will generate an id using
 * Vue's built-in `useId` (>= 3.5) or an internal counter fallback.
 */
export function useId(deterministicId?: string | null | undefined, prefix = 'vy') {
  if (deterministicId)
    return deterministicId

  let id: string
  if ('useId' in vue) {
    id = vue.useId?.() ?? `${++count}`
  }
  else {
    id = `${++count}`
  }

  return prefix ? `${prefix}-${id}` : id
}
