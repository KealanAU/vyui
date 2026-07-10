import { useId as vueUseId } from 'vue'

/**
 * Generates a unique identifier, or returns `deterministicId` when provided.
 * @param deterministicId - returned verbatim when set; otherwise an id is
 *   generated via Vue's built-in `useId`.
 */
export function useId(deterministicId?: string | null | undefined, prefix = 'vy') {
  if (deterministicId)
    return deterministicId

  const id = vueUseId()
  return prefix ? `${prefix}-${id}` : id
}
