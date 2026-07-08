// @vyui/core — Lynx-native components.
//
// Tap-driven primitives plus the MT-worklet-driven touch/drag family (Sheet,
// Swiper, SwipeAction, Draggable, Sortable, ScrollView, FeedList,
// LazyComponent).

export * from './components/OverlayRoot'

// Overlays + menus (tap-driven; work on Lynx native)
export * from './components/AlertDialog'
export * from './components/Dialog'
export * from './components/DropdownMenu'
export * from './components/Popover'
export * from './components/Select'
export * from './components/Sheet'

export * from './components/Combobox'

// vyui originals
export * from './components/Button'
export * from './components/ConfigProvider'
export * from './components/Form'
export * from './components/Icon'
export * from './components/Input'
export * from './components/IslandContainer'

// Disclosure + universal Phase 1 components
export * from './components/Accordion'
export * from './components/AspectRatio'
export * from './components/Avatar'
export * from './components/Checkbox'
export * from './components/Collapsible'
export * from './components/Label'
export * from './components/NumberField'
export * from './components/Pagination'
export * from './components/PinInput'
export * from './components/Presence'
export { type AsTag, Primitive, type PrimitiveProps, Slot, usePrimitiveElement } from './components/Primitive'
export * from './components/Progress'
export * from './components/RadioGroup'
export * from './components/Rating'
export * from './components/Separator'
export * from './components/Slider'
export * from './components/Stepper'
export * from './components/Switch'
export * from './components/Tabs'
export * from './components/Toast'
export * from './components/Toggle'
export * from './components/ToggleGroup'

// Screen-stack navigation (push/pop pages, iOS / Material style)
export * from './components/Navigation'

export * from './components/Draggable'
export * from './components/FeedList'
export * from './components/LazyComponent'
export * from './components/List'
export * from './components/ScrollView'
export * from './components/Sortable'
export * from './components/SwipeAction'
export * from './components/Swiper'

export {
  type Components,
  components,
  type Originals,
  originals,
  type Utilities,
  utilities,
} from './constants'

// Lynx-native composables (universal — used across tiers)
export * from './shared/composables'

// Intl polyfill for Lynx's PrimJS engine — call once at app entry if any
// component formats dates / numbers.
export { installIntlPolyfill } from './shared/intl'

export {
  createContext,
  isNullish,
  isValueEqualOrExist,
  useDirection,
  useEmitAsProps,
  useFilter,
  useForwardExpose,
  useForwardProps,
  useForwardPropsEmits,
  useId,
  useLocale,
  useStateMachine,
  withDefault,
} from './shared'
export {
  type AcceptableValue,
  type DataOrientation,
  type Direction,
  type FormFieldProps,
  type GenericComponentInstance,
  type VyStyle,
  type SingleOrMultipleProps,
  type SingleOrMultipleType,
  type StringOrNumber,
} from './shared/types'
