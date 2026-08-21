import type { Ref } from 'vue'
import { createContext } from '@vyui/core'

/**
 * Context shared between `<VyIsland>` and its children (`<VyIslandButton>`),
 * holding the three independent state axes the wrapper tracks: `open` (panel
 * expansion), `mode` (which named row slot renders) and `value` (selected tab).
 *
 * Buttons opt into any combination via declarative props (`mode`, `expand`,
 * `value`, …) instead of hand-wired `@tap` handlers.
 */
export type IslandSize = 'sm' | 'md' | 'lg' | 'xl'

export interface IslandContext {
  open: Ref<boolean>
  mode: Ref<string>
  value: Ref<string | number | null>
  /** Wrapper-level size — child `<VyIslandButton>`s inherit it unless they pass
   *  an explicit `size`. */
  size: Ref<IslandSize>
  setOpen: (next: boolean) => void
  toggle: () => void
  close: () => void
  setMode: (next: string) => void
  resetMode: () => void
  setValue: (next: string | number | null) => void
}

export const [injectIslandContext, provideIslandContext]
  = createContext<IslandContext>('VyIsland')
