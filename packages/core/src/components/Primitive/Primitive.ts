import type { Component, PropType } from 'vue'
import { defineComponent, h } from 'vue'
import { Slot } from './Slot'

export type AsTag
  = | 'view'
    | 'text'
    | 'scroll-view'
    | 'input'
    | 'image'
    | 'overlay'
    | 'template'
    | ({} & string) // any other string

export interface PrimitiveProps {
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   *
   * Use this when you need a component to render through a child element while
   * keeping the primitive's props and behavior.
   */
  asChild?: boolean
  /**
   * The element or component this component should render as. Can be overwritten by `asChild`.
   * @defaultValue "view"
   */
  as?: AsTag | Component
}

// Lynx leaf elements that must render WITHOUT children. Vue emits fragment /
// comment anchor nodes even for empty slots, and vue-lynx materializes those
// as real elements on native (`createComment` → `__comment`, fragment anchors
// → `#text`). A native `<image>` with any child fails to render (lynx-web
// tolerates it, so the breakage is native-only).
const SELF_CLOSING_TAGS = ['input', 'image']

/**
 * Drop `undefined`-valued attrs before they reach the renderer.
 *
 * Vue's DOM renderer omits an attribute whose value is `undefined`; vue-lynx's
 * does not. Its `patchProp` has no nullish guard, so the prop is patched like
 * any other, crosses the op bridge as JSON (`undefined` → `null` inside the
 * ops array) and lands as `__SetAttribute(el, key, null)` — a native
 * prop-reset for a prop that was never set. Omitting the key skips the native
 * call entirely. A stock `<Textarea>` alone emits ~11 of these per mount.
 *
 * Only `undefined` is dropped. An explicit `null` still reaches the element,
 * so it stays available as a deliberate "reset this prop" escape hatch, and
 * Vue keeps emitting `null` itself when a prop genuinely transitions from a
 * value to absent (its removed-key path in `patchProps`), so clearing a prop
 * at runtime is unaffected.
 */
function definedAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  const defined: Record<string, unknown> = {}
  for (const key in attrs) {
    if (attrs[key] !== undefined) defined[key] = attrs[key]
  }
  return defined
}

export const Primitive = defineComponent({
  name: 'Primitive',
  inheritAttrs: false,
  props: {
    asChild: {
      type: Boolean,
      default: false,
    },
    as: {
      type: [String, Object] as PropType<AsTag | Component>,
      default: 'view',
    },
  },
  setup(props, { attrs, slots }) {
    const asTag = props.asChild ? 'template' : props.as

    if (typeof asTag === 'string' && SELF_CLOSING_TAGS.includes(asTag))
      return () => h(asTag, definedAttrs(attrs))

    if (asTag !== 'template')
      return () => h(props.as, definedAttrs(attrs), { default: slots.default })

    return () => h(Slot, definedAttrs(attrs), { default: slots.default })
  },
})
