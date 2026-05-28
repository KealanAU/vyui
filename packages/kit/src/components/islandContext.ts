import type { Ref } from 'vue'
import { createContext } from '@vyui/core'

/**
 * Context shared between `<VyIsland>` and its children (`<VyIslandButton>`).
 *
 * Holds the three independent state axes the island wrapper tracks:
 *  - `open`   — panel expanded / collapsed
 *  - `mode`   — which "row mode" is active (`default`, `search`, custom...).
 *               Drives which named slot the wrapper renders for the row.
 *  - `value`  — currently-selected tab value, for active-state tracking on
 *               `<VyIslandButton :value=…>` children.
 *
 * Buttons opt into any combination of these via declarative props (`mode`,
 * `expand`, `value`, …) instead of hand-wiring `@tap` handlers — keeps the
 * call site declarative and the wrapper free to evolve the API.
 */
export type IslandSize = 'sm' | 'md' | 'lg' | 'xl'

export interface IslandContext {
  open: Ref<boolean>
  mode: Ref<string>
  value: Ref<string | number | null>
  /**
   * Wrapper-level size — child `<VyIslandButton>`s inherit this when they
   * don't pass an explicit `size` prop, so the call site only sets sizing
   * once on the parent.
   */
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
