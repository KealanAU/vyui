/**
 * Dialog utils — Lynx-safe.
 *
 * reka-ui's `utils.ts` exposes `useWarning`, a dev-only check that reaches into
 * the DOM (`document.getElementById`, `el.getAttribute`) to warn when a
 * `DialogContent` is missing its `DialogTitle` / `DialogDescription`. None of
 * those DOM APIs exist on Lynx, so the check is kept as a structural no-op:
 * the function and its `WarningProps` type survive (mirroring reka's file
 * layout and call sites) but the body does nothing.
 */

import type { Ref } from 'vue'

export type WarningProps = {
  titleName?: string
  contentName?: string
  componentLink?: string
  titleId: string
  descriptionId: string
  contentElement: Ref<unknown>
}

/**
 * Accessibility-warning hook. No-op on Lynx — there is no DOM to inspect for
 * the presence of a title/description node. Retained so `DialogContentImpl`
 * can call it exactly where reka-ui does.
 */
export function useWarning(_props: WarningProps): void {
  // Intentionally empty — see file header.
}
