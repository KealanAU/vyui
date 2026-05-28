import { getCurrentInstance } from 'vue'

/**
 * Captures the calling component's `provides` record so children rendered
 * through the OverlayRoot portal can resolve injections back to this tree.
 *
 * `ComponentInternalInstance.provides` is intentionally internal in Vue —
 * the public types don't expose it, so we centralize the unavoidable cast
 * here. Call from `<script setup>` only (during component setup).
 */
export function captureProvides(): Record<string | symbol, unknown> | undefined {
  const instance = getCurrentInstance() as unknown as { provides?: Record<string | symbol, unknown> } | null
  return instance?.provides
}
