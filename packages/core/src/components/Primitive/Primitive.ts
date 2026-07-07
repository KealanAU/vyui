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
      return () => h(asTag, attrs)

    if (asTag !== 'template')
      return () => h(props.as, attrs, { default: slots.default })

    return () => h(Slot, attrs, { default: slots.default })
  },
})
