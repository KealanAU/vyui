import type { ComputedRef, Ref } from 'vue'
import { createContext } from '@vyui/core'

/**
 * Context shared between `<VyTray>` and its subtree (`<VyTrayView>` children,
 * trigger/footer slots, and any consumer calling `useTray()`).
 *
 * A tray is a morphing bottom sheet hosting multiple named views, navigated
 * with a history stack — the panel height animates to fit each view. This
 * context is the single source of truth for that navigation: writers
 * (`open`/`setView`/`goBack`) maintain the stack, consumers read the refs.
 * Mirrors `expo-dynamic-tray`'s `useTray()` surface.
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
 * Read the enclosing `<VyTray>`'s navigation controller — call from any
 * component rendered inside a tray to drive it imperatively (`setView('confirm')`,
 * `goBack()`). Throws if used outside a `<VyTray>`.
 */
export function useTray(): TrayContext {
  return injectTrayContext()
}
