/**
 * useNavigationStack — reactive push/pop stack for screen-style navigation.
 *
 * Lynx ships no `<router-view>` equivalent, and pages on iOS / Android stack
 * imperatively (UINavigationController.push, Fragment back stack); this mirrors
 * that model in a single ref of entries. Each entry has a `key` (looked up by
 * the consuming `<NavigationStack>` / `<NavigationPage>`) and optional `data`
 * the rendered page can read.
 */
import { computed, ref, type Ref, type ComputedRef } from 'vue'

export interface NavigationStackEntry<TData = unknown> {
  /** Page identifier — must match the `key` on a `<NavigationPage>`. */
  key: string
  /** Arbitrary payload made available to the rendered page. */
  data?: TData
}

export interface NavigationStackApi<TData = unknown> {
  /** All entries from root → top. The last entry is the current page. */
  entries: Ref<NavigationStackEntry<TData>[]>
  /** Convenience accessor for the top entry (or `undefined` if empty). */
  current: ComputedRef<NavigationStackEntry<TData> | undefined>
  /** True when more than one page is on the stack (a back arrow can be shown). */
  canGoBack: ComputedRef<boolean>
  /** Direction of the last navigation — useful to drive enter/leave anims. */
  direction: Ref<'forward' | 'back' | 'replace' | 'reset'>
  /** Push a new page onto the stack. */
  push: (key: string, data?: TData) => void
  /** Pop one or more pages off the stack. No-op when at the root. */
  pop: (steps?: number) => void
  /** Replace the current page with a different one (no stack growth). */
  replace: (key: string, data?: TData) => void
  /** Reset the stack to a brand-new entry list. */
  reset: (entries: Array<string | NavigationStackEntry<TData>>) => void
}

function normalise<T>(entry: string | NavigationStackEntry<T>): NavigationStackEntry<T> {
  return typeof entry === 'string' ? { key: entry } : entry
}

export function useNavigationStack<TData = unknown>(
  initial: Array<string | NavigationStackEntry<TData>> = [],
): NavigationStackApi<TData> {
  const entries = ref(initial.map(normalise)) as Ref<NavigationStackEntry<TData>[]>
  const direction = ref<'forward' | 'back' | 'replace' | 'reset'>('reset')

  const current = computed(() => entries.value[entries.value.length - 1])
  const canGoBack = computed(() => entries.value.length > 1)

  function push(key: string, data?: TData) {
    entries.value = [...entries.value, { key, data }]
    direction.value = 'forward'
  }

  function pop(steps = 1) {
    if (entries.value.length <= 1) return
    const next = entries.value.slice(0, Math.max(1, entries.value.length - steps))
    entries.value = next
    direction.value = 'back'
  }

  function replace(key: string, data?: TData) {
    if (entries.value.length === 0) {
      entries.value = [{ key, data }]
    }
    else {
      const next = entries.value.slice(0, -1)
      next.push({ key, data })
      entries.value = next
    }
    direction.value = 'replace'
  }

  function reset(next: Array<string | NavigationStackEntry<TData>>) {
    entries.value = next.map(normalise)
    direction.value = 'reset'
  }

  return { entries, current, canGoBack, direction, push, pop, replace, reset }
}
