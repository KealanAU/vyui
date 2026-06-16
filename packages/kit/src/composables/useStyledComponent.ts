import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'
import { tv, type TVReturnType, type VariantProps } from 'tailwind-variants'
import { resolveColors } from '../theme/colors'
import { useAppConfig } from './useAppConfig'

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
 * Resolve a theme to its concrete `tv` config. Theme default exports are now
 * **builder functions** `(colors: string[]) => themeObject` so the configurable
 * color list (`appConfig.ui.colors`) threads into the emitted variants. Legacy
 * plain-object themes are passed through unchanged.
 */
export type ResolveTheme<T> = T extends (...args: never[]) => infer R ? R : T

/**
 * Build a per-app-config `tv` factory for a styled component. Merges the
 * package default theme with any user override at `appConfig.ui[name]` and
 * returns the invoked slot map (under `ui`).
 *
 * Accepts either a builder theme (`(colors) => themeObject`, invoked with the
 * resolved color list) or a plain theme object (used as-is). Builder detection
 * happens inside the `computed`, so themes track `appConfig.ui.colors`
 * reactively.
 *
 * Type-wise: the factory return type is `ReturnType<typeof tv>` — same as
 * what the hand-written `buildXxx` helpers produced. That keeps the
 * `VariantProps<ReturnType<typeof tv>>` shape that components use to derive
 * their public variant prop types working without change.
 *
 * @param name      Key under `appConfig.ui` where user overrides live (e.g.
 *                  `'button'`, `'switch'`).
 * @param theme     The package default theme — a builder function or a plain
 *                  `tv` config object.
 * @param variants  Variant props for the component. Accepts a ref, getter, or
 *                  plain object; re-evaluated on every change.
 */
export function useStyledComponent<TTheme>(
  name: string,
  theme: TTheme,
  variants: MaybeRefOrGetter<Record<string, unknown>>,
): {
  ui: ComputedRef<TVInvoked>
} {
  const appConfig = useAppConfig()
  const tvFactory = computed(() => {
    // Builder themes are invoked with the resolved color list; plain-object
    // themes pass through. `resolveColors` reads `appConfig.ui.colors`, keeping
    // this reactive to runtime color config.
    const base = typeof theme === 'function'
      ? (theme as (colors: string[]) => unknown)(resolveColors(appConfig))
      : theme
    const overrides = (appConfig.ui as Record<string, unknown>)[name] as Record<string, unknown> | undefined
    // `extend: tv(base)` lets app-level overrides win on a key-by-key basis
    // while still inheriting everything from the package default. Cast through
    // `unknown` because `tv`'s parameter type is an overloaded generic that
    // doesn't match a `TTheme` constraint cleanly — see TODO above.
    return tv({ extend: tv(base as never), ...(overrides || {}) } as never) as unknown as TVFactory
  })
  const ui = computed(() => tvFactory.value(toValue(variants) as Parameters<TVFactory>[0]))
  return { ui }
}

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
// `ResolveTheme<TTheme>` unwraps builder themes (`(colors) => themeObject`) to
// their config object first, so `ThemeTV<typeof theme>` keeps working unchanged
// for both builder and plain-object themes — zero component-side changes.
export type ThemeTV<TTheme, R = ResolveTheme<TTheme>> = TVReturnType<
  // Variants — extracted from the (resolved) theme.
  R extends { variants: infer V } ? (V extends Record<string, any> ? V : any) : any,
  // Slots — extracted from the (resolved) theme.
  R extends { slots: infer S } ? (S extends Record<string, any> ? S : any) : any,
  // B (base) stays `any`; the rest must NOT be `any`. `TVProps` branches on the
  // extend-variants param — `any` there widens every variant key to
  // `PropertyKey` (losing the literal `color` union). `{}` for config/extend
  // variants and `undefined` for extend slots/extend take the clean branch so
  // `VariantProps<ThemeTV<…>>` recovers the exact variant unions.
  any, {}, {}, undefined, undefined
>

export type { VariantProps }
