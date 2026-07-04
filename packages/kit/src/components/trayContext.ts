import type { ComputedRef, Ref } from 'vue'
import { createContext } from '@vyui/core'

/**
 * Context shared between `<VyTray>` and its subtree (`<VyTrayView>` children,
 * trigger/footer slots, and any consumer calling `useTray()`).
 *
 * A tray is a morphing bottom sheet that hosts multiple named **views** and
 * navigates between them with a history stack — the panel height animates to
 * fit each view ("grows into place"). This context is the single source of
 * truth for that navigation:
 *
 *  - `view`      — id of the currently-rendered view. `<VyTrayView :id>` shows
 *                  its slot only when this matches.
 *  - `visible`   — whether the tray is open.
 *  - `canGoBack` — true when the history stack is non-empty (a `setView` has
 *                  pushed a frame that `goBack` can pop).
 *
 * Navigation writers (`open`/`setView`/`goBack`) maintain the stack; consumers
 * read the refs. Mirrors `expo-dynamic-tray`'s `useTray()` surface.
 */
export interface TrayContext {
  /** Id of the currently-visible view. */
  view: Ref<string>
  /** Whether the tray is open. */
  visible: Ref<boolean>
  /** True when `goBack()` has somewhere to return to. */
  canGoBack: ComputedRef<boolean>
  /** Open the tray, optionally jumping to `view` (defaults to `defaultView`). */
  open: (view?: string) => void
  /** Close the tray. */
  close: () => void
  /** Navigate to `id`, pushing the current view onto the back stack. */
  setView: (id: string) => void
  /** Pop the back stack and return to the previous view. No-op if empty. */
  goBack: () => void
}

export const [injectTrayContext, provideTrayContext]
  = createContext<TrayContext>('VyTray')

/**
 * Read the enclosing `<VyTray>`'s navigation controller. Call from any
 * component rendered inside a tray (view bodies, footer, custom triggers) to
 * drive it imperatively:
 *
 * ```ts
 * const tray = useTray()
 * tray.setView('confirm')   // navigate + push history
 * tray.goBack()             // pop back
 * ```
 *
 * Throws if used outside a `<VyTray>`.
 */
export function useTray(): TrayContext {
  return injectTrayContext()
}
