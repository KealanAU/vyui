import type { IntrinsicElements } from '@lynx-js/types'

type DataOrientation = 'vertical' | 'horizontal'
type Direction = 'ltr' | 'rtl'
type SingleOrMultipleType = 'single' | 'multiple'

interface SingleOrMultipleProps<T = AcceptableValue | AcceptableValue[]> {
  /**
   * Whether a "single" or "multiple" items can be selected at a time. Overwrites
   * the type inferred from `modelValue` and `defaultValue`.
   */
  type?: SingleOrMultipleType

  /** The controlled value of the active item(s). Can be bound with `v-model`. */
  modelValue?: T

  /** The default active value of the item(s), for uncontrolled use. */
  defaultValue?: T
}

/**
 * A painted element handle returned by ref forwarding — a `ShadowElement`-like
 * handle on Lynx native, a DOM element in web preview. Intentionally loose: call
 * sites feature-detect before reaching for runtime-specific members.
 *
 * Used in place of bare `HTMLElement` / `Element`, which don't exist in Lynx's
 * `lib` and would leak DOM types into consumers' emitted `.d.ts`.
 */
type ElementHandle = Record<string, any>

// Exclude `boolean` type to prevent type casting
// reference: https://vuejs.org/guide/components/props.html#boolean-casting
type AcceptableValue = string | number | bigint | Record<string, any> | null
type ArrayOrWrapped<T> = T extends any[] ? T : Array<T>
type StringOrNumber = string | number

// Temporary solution for InstanceType complains about generic components. Reference: https://github.com/vuejs/language-tools/issues/3206#issuecomment-2188687250
import type { DefineComponent } from 'vue'

type GenericComponentInstance<T> = T extends new (...args: any[]) => infer R
  ? R
  : T extends (...args: any[]) => infer R
    ? R extends { __ctx?: infer K }
      ? Exclude<K, void> extends { expose: (...args: infer Y) => void }
        ? Y[0] & InstanceType<DefineComponent>
        : any
      : any
    : any

interface FormFieldProps {
  /** The name of the field. Submitted with its owning form as part of a name/value pair. */
  name?: string
  /** When `true`, indicates that the user must set the value before the owning form can be submitted. */
  required?: boolean
}

/**
 * The Lynx style-object type accepted by every primitive's `:style` binding —
 * the object form of `@lynx-js/types` `CSSProperties`. Use it to type shared
 * style constants instead of reaching for `as const`.
 */
type VyStyle = Exclude<NonNullable<IntrinsicElements['view']['style']>, string>

export type { AcceptableValue, ArrayOrWrapped, DataOrientation, Direction, ElementHandle, FormFieldProps, GenericComponentInstance, VyStyle, SingleOrMultipleProps, SingleOrMultipleType, StringOrNumber }
