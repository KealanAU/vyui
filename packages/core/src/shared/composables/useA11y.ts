/**
 * useA11y — central accessibility layer for Vy UI primitives.
 *
 * Turns a small semantic descriptor (`{ role, state, label, … }`) into the
 * native Lynx `accessibility-*` props to spread onto a `Primitive`:
 *
 * ```ts
 * const a11y = useA11y(() => ({
 *   role: 'checkbox',
 *   state: checked.value ? 'checked' : 'unchecked',
 *   disabled: disabled.value,
 *   label: attrs['accessibility-label'] as string,
 * }))
 * // <Primitive v-bind="a11y" />
 * ```
 *
 * Why a single helper:
 *  - Lynx's native a11y is NOT ARIA-shaped — state is announced through the
 *    `accessibility-value` string, traits come from a fixed 15-value enum, and
 *    there is no structured checked/expanded attribute. Centralising the
 *    mapping keeps every component consistent and correct against
 *    `@lynx-js/types`.
 *  - Lynx does NO native↔ARIA bridging (verified against lynx-stack web
 *    packages): `accessibility-*` props are inert on the Lynx Web target and
 *    web `aria-*` is inert on native. So web ARIA can be layered in later, in
 *    ONE place (`appendWebA11y`), as a no-op-on-native addition — without
 *    touching every component again.
 *
 * See docs/plans/lynx-compat.md.
 */

import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

/**
 * The complete `accessibility-traits` enum accepted by Lynx
 * (`@lynx-js/types` → `props.d.ts`). Only ONE value may be set per element.
 */
export type A11yTrait =
  | 'text' | 'image' | 'button' | 'link' | 'header' | 'search'
  | 'selected' | 'playable' | 'keyboard' | 'summary' | 'disabled'
  | 'updating' | 'adjustable' | 'tabbar' | 'none'

/** Semantic role — mapped to a native trait (+ role-description) below. */
export type A11yRole =
  | 'button' | 'link' | 'checkbox' | 'radio' | 'switch' | 'tab'
  | 'option' | 'menuitem' | 'slider' | 'progressbar' | 'searchbox'
  | 'textbox' | 'heading' | 'image' | 'text' | 'dialog' | 'alertdialog'
  | 'alert' | 'menu' | 'summary' | 'none'

export interface A11yDescriptor {
  /** Semantic role; maps to `accessibility-traits` (+ `accessibility-role-description`). */
  role?: A11yRole
  /** Announced label → `accessibility-label`. */
  label?: string
  /**
   * Interactive state announced via `accessibility-value`. Pass a ready-made
   * word such as `'checked' | 'unchecked' | 'mixed' | 'expanded' | 'collapsed'
   * | 'selected' | 'on' | 'off' | 'pressed'`. Falsy values are omitted.
   */
  state?: string | false | null
  /**
   * Range value for slider/progress → `accessibility-value`. `text` wins;
   * otherwise composed as `"{now} of {max}"`.
   */
  value?: { now?: number | null, max?: number, text?: string }
  /** When `true`, the trait becomes `'disabled'` (Lynx allows a single trait). */
  disabled?: boolean
  /** Hide the node and its descendants from the a11y tree. */
  hidden?: boolean
  /** Trap a11y focus to this subtree — for modal overlays (dialog/sheet/popover). */
  exclusiveFocus?: boolean
  /**
   * Whether the node is exposed as a single focusable a11y element. Defaults
   * to `true` when the descriptor carries a role/label/state (`<view>` is not
   * a focus node by default on Lynx). Pass `false` to opt a node out.
   */
  element?: boolean
}

/** Native Lynx a11y props, ready to `v-bind` onto a `Primitive`. */
export interface A11yProps {
  'accessibility-element'?: boolean
  'accessibility-traits'?: A11yTrait
  'accessibility-label'?: string
  'accessibility-value'?: string
  'accessibility-role-description'?: string
  'accessibility-heading'?: boolean
  'accessibility-elements-hidden'?: boolean
  'accessibility-exclusive-focus'?: boolean
}

interface RoleMapping {
  trait: A11yTrait
  roleDescription?: string
  heading?: boolean
}

/**
 * role → native trait. Lynx has no `dialog`/`alert`/`menu`/`checkbox` traits,
 * so those fall back to a valid trait and carry the word in
 * `accessibility-role-description` (Android) for extra signal.
 */
const ROLE_MAP: Record<A11yRole, RoleMapping> = {
  button: { trait: 'button' },
  link: { trait: 'link' },
  checkbox: { trait: 'button', roleDescription: 'checkbox' },
  radio: { trait: 'button', roleDescription: 'radio' },
  switch: { trait: 'button', roleDescription: 'switch' },
  tab: { trait: 'button', roleDescription: 'tab' },
  option: { trait: 'button' },
  menuitem: { trait: 'button' },
  slider: { trait: 'adjustable' },
  progressbar: { trait: 'updating', roleDescription: 'progressbar' },
  searchbox: { trait: 'search' },
  textbox: { trait: 'keyboard' },
  heading: { trait: 'header', heading: true },
  image: { trait: 'image' },
  text: { trait: 'text' },
  dialog: { trait: 'none', roleDescription: 'dialog' },
  alertdialog: { trait: 'none', roleDescription: 'alert dialog' },
  alert: { trait: 'updating', roleDescription: 'alert' },
  menu: { trait: 'none', roleDescription: 'menu' },
  summary: { trait: 'summary' },
  none: { trait: 'none' },
}

function resolveValue(d: A11yDescriptor): string | undefined {
  if (d.value) {
    if (d.value.text)
      return d.value.text
    const { now, max } = d.value
    if (typeof now === 'number' && typeof max === 'number')
      return `${now} of ${max}`
    if (typeof now === 'number')
      return String(now)
    return undefined
  }
  return d.state ? d.state : undefined
}

function buildNative(d: A11yDescriptor): A11yProps {
  if (d.hidden)
    return { 'accessibility-elements-hidden': true }

  const map = d.role ? ROLE_MAP[d.role] : undefined
  const props: A11yProps = {}

  // A single trait only: `disabled` overrides the role trait.
  const trait = d.disabled ? 'disabled' : map?.trait
  if (trait)
    props['accessibility-traits'] = trait

  if (map?.roleDescription)
    props['accessibility-role-description'] = map.roleDescription
  if (map?.heading)
    props['accessibility-heading'] = true
  if (d.label)
    props['accessibility-label'] = d.label

  const value = resolveValue(d)
  if (value != null)
    props['accessibility-value'] = value

  // Expose as a focusable node when it carries semantics, unless told otherwise.
  const element = d.element ?? (d.role != null || d.label != null || value != null)
  if (element)
    props['accessibility-element'] = true

  if (d.exclusiveFocus)
    props['accessibility-exclusive-focus'] = true

  return props
}

/**
 * Web ARIA layer — intentionally a no-op today.
 *
 * Lynx does no native↔ARIA bridging, so `accessibility-*` props are inert on
 * the Lynx Web target. When web support is prioritised, map `descriptor` →
 * `role`/`aria-*` here and merge into `props`; on native this stays a no-op
 * (web attrs are simply ignored by the native renderer). See
 * docs/plans/lynx-compat.md.
 */
function appendWebA11y(props: A11yProps, _descriptor: A11yDescriptor): A11yProps {
  return props
}

/**
 * Returns a computed bag of native Lynx `accessibility-*` props for the given
 * semantic descriptor. Spread onto a `Primitive` with `v-bind`.
 */
export function useA11y(source: MaybeRefOrGetter<A11yDescriptor>): ComputedRef<A11yProps> {
  return computed(() => {
    const descriptor = toValue(source)
    return appendWebA11y(buildNative(descriptor), descriptor)
  })
}
