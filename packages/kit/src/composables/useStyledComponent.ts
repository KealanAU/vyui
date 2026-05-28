import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { tv, type TVReturnType, type VariantProps } from 'tailwind-variants'
import { useAppConfig } from './useAppConfig'

/**
 * The shape of a theme object accepted by `tailwind-variants`' `tv` — the
 * first arg of `tv`. We pull it off `Parameters<typeof tv>[0]` so any future
 * upstream type tweaks ride along automatically.
 */
export type TVOptions = Parameters<typeof tv>[0]

/**
 * The factory returned by calling `tv(theme)`. Calling it with variant props
 * yields the slot map (or class string for slotless themes).
 */
export type TVFactory = ReturnType<typeof tv>

/**
 * The invoked result of a `tv` factory — either a slot map (object of slot
 * fns) or a flat class string. The component-side type is generally the
 * intersection of those two (`string & { [slot]: ... }`), which is how
 * tailwind-variants types the call without picking a branch.
 *
 * TODO(types): the upstream `TV` is an interface (not a generic function),
 * so we can't thread `TTheme` into the slot-key list. Component templates
 * still get the right shape because Volar resolves `ui.value.<slot>` against
 * the actual `tv(theme)` factory after type narrowing — this `any` only
 * shows up if a caller pulls `useStyledComponent` apart and re-types it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TVInvoked = any

/**
 * Build a per-app-config `tv` factory for a styled component. Merges the
 * package default theme with any user override at `appConfig.ui[name]` and
 * returns the invoked slot map (under `ui`) plus the raw factory (under
 * `tvFactory`) for callers that need to invoke it with different variants.
 *
 * Type-wise: the factory return type is `ReturnType<typeof tv>` — same as
 * what the hand-written `buildXxx` helpers produced. That keeps the
 * `VariantProps<ReturnType<typeof tv>>` shape that components use to derive
 * their public variant prop types working without change.
 *
 * @param name      Key under `appConfig.ui` where user overrides live (e.g.
 *                  `'button'`, `'switch'`).
 * @param theme     The package default theme — passed directly into `tv`.
 * @param variants  Variant props for the component. Accepts a ref, getter, or
 *                  plain object; re-evaluated on every change.
 */
export function useStyledComponent<TTheme>(
  name: string,
  theme: TTheme,
  variants: MaybeRefOrGetter<Record<string, unknown>>,
): {
  ui: ComputedRef<TVInvoked>
  tvFactory: ComputedRef<TVFactory>
} {
  const appConfig = useAppConfig()
  const tvFactory = computed(() => {
    const overrides = (appConfig.ui as Record<string, unknown>)[name] as Partial<TTheme> | undefined
    // `extend: tv(theme)` lets app-level overrides win on a key-by-key basis
    // while still inheriting everything from the package default. Cast through
    // `unknown` because `tv`'s parameter type is an overloaded generic that
    // doesn't match a `TTheme` constraint cleanly — see TODO above.
    return tv({ extend: tv(theme as never), ...(overrides || {}) } as never) as unknown as TVFactory
  })
  const ui = computed(() => tvFactory.value(toValue(variants) as Parameters<TVFactory>[0]))
  return { ui, tvFactory }
}

/**
 * Helper for the standard `ui` prop on styled components. Given the invoked
 * factory type (`ReturnType<ReturnType<typeof tv<typeof theme>>>`), produces
 * the matching `Partial<Record<slotKey, ClassValue>>` shape used to override
 * individual slot classes from the call site.
 */
export type StyledSlotsProp<TUI> = Partial<Record<keyof TUI, any>>

/**
 * Type-only helper for deriving the `tv` factory return type from a theme
 * object. `tv` is an overloaded interface (not a generic function), so
 * `ReturnType<typeof tv<typeof theme>>` doesn't work directly. We instead
 * project the theme's `slots` / `variants` shape into `TVReturnType` ourselves,
 * which is what `tv` itself returns at runtime.
 *
 * Usage in a component `<script lang="ts">`:
 *
 *   import theme from '../theme/button'
 *   import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'
 *   type ButtonTV = ThemeTV<typeof theme>
 *   type ButtonVariants = VariantProps<ButtonTV>
 *
 * Equivalent to the old `VariantProps<ReturnType<typeof buildButton>>` chain
 * but with no per-component factory function in the public surface.
 */
// `TVReturnType` projects the theme's `variants` directly into the call
// signature returned to consumers, so `VariantProps<>` can introspect it via
// `Parameters[0]`. The `any`s for the other type params (`B`/`C`/`EV`/`ES`)
// are intentional — none of them affect the variant key shape that the
// component public API depends on.
//
// eslint-disable @typescript-eslint/no-explicit-any
export type ThemeTV<TTheme> = TVReturnType<
  // Variants — extracted from the theme.
  TTheme extends { variants: infer V } ? (V extends Record<string, any> ? V : any) : any,
  // Slots — extracted from the theme.
  TTheme extends { slots: infer S } ? (S extends Record<string, any> ? S : any) : any,
  any, any, any, any, any
>

export type { VariantProps }
