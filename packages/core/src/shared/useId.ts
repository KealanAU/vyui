import * as vue from 'vue'
// Inspired from https://github.com/tailwindlabs/headlessui/issues/2913
// as the alternative, and a fallback for Vue version < 3.5

let count = 0
/**
 * Generates a unique identifier, or returns `deterministicId` when provided.
 * @param deterministicId - returned verbatim when set; otherwise an id is
 *   generated via Vue's built-in `useId` (>= 3.5) or an internal counter.
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
