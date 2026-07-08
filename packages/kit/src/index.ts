// @vyui/kit — styled Vue-Lynx components built on @vyui/core.

export { VyUI } from './plugin'
export { provideVyUI } from './provide'

export { useAppConfig } from './composables/useAppConfig'
export { useColorMode, type ColorMode, type UseColorModeReturn } from './composables/useColorMode'
export { useComponentIcons, type UseComponentIconsProps } from './composables/useComponentIcons'

export {
  APP_CONFIG_KEY,
  type AppConfig,
  type VyUIPluginOptions,
  type DeepPartial,
  type ComponentThemes,
} from './types'

export { createTv, tv } from './utils/tv'

// Bake a semantic color to a literal hex for Lynx `<svg>` icons — Lynx
// rasterizes SVG, so `text-*` classes / `currentColor` never reach the glyph;
// pass the result to the Icon `color` prop. Shade is the caller's mode
// awareness (accent tier: 500 light / 400 dark — see `useColorMode().isDark`).
export { resolveColorHex } from './utils/resolveColor'

// Semantic color set. `VyuiColorRegistry` is the augmentation point for true
// parity: `declare module '@vyui/kit' { interface VyuiColorRegistry { … } }`
// adds colors to every component's `color` prop type. See `theme/colors.ts`.
export {
  ALL_COLORS,
  COLORS,
  NEUTRAL,
  resolveColors,
  type Color,
  type VyuiColorRegistry,
} from './theme/colors'

// Components are exported under a single canonical `Vy*` name — the same name
// the `VyUI` plugin registers globally (see components/registry.ts). Do NOT add
// bare aliases (`export { default as Button }`): two names per component is a
// drift hazard for docs/examples and gives consumers no signal which is
// canonical. Types keep their upstream names (`AspectRatioProps`, `IconProps`).
export { default as VyAccordion } from './components/Accordion.vue'
export { default as VyActionSheet } from './components/ActionSheet.vue'
export { default as VyAlert } from './components/Alert.vue'
export { default as VyApp } from './components/App.vue'
// AspectRatio/Icon are pure core primitives (nothing to theme); re-exported here
// under their `Vy*` name so they sit alongside the other kit components.
export { AspectRatio as VyAspectRatio, type AspectRatioProps } from '@vyui/core'
export { default as VyAvatar } from './components/Avatar.vue'
export { default as VyAvatarGroup } from './components/AvatarGroup.vue'
export { default as VyBadge } from './components/Badge.vue'
export { default as VyButton } from './components/Button.vue'
export { default as VyCalendar } from './components/Calendar.vue'
export { default as VyCard } from './components/Card.vue'
export { default as VyCheckbox } from './components/Checkbox.vue'
export { default as VyChip } from './components/Chip.vue'
export { default as VyCombobox } from './components/Combobox.vue'
export { default as VyDrawer } from './components/Drawer.vue'
export { default as VyDropdownMenu } from './components/DropdownMenu.vue'
export { default as VyFeedList } from './components/FeedList.vue'
export { default as VyForm } from './components/Form.vue'
export { default as VyFormField } from './components/FormField.vue'
export { Icon as VyIcon, type IconProps } from '@vyui/core'
export { default as VyInput } from './components/Input.vue'
// Re-export keyboard-aware primitives from core under Vy* aliases so consumers
// can lift any surface (not just <VyDrawer>) above the on-screen keyboard.
export {
  KeyboardAwareResponder as VyKeyboardAwareResponder,
  KeyboardAwareRoot as VyKeyboardAwareRoot,
  KeyboardAwareTrigger as VyKeyboardAwareTrigger,
} from '@vyui/core'
export { default as VyIsland } from './components/Island.vue'
export { default as VyIslandButton } from './components/IslandButton.vue'
export { default as VyIslandGroup } from './components/IslandGroup.vue'
export { default as VyLabel } from './components/Label.vue'
export { default as VyModal } from './components/Modal.vue'
export { default as VyNumberField } from './components/NumberField.vue'
export { default as VyPinInput } from './components/PinInput.vue'
export { default as VyPlaceholder } from './components/Placeholder.vue'
export { default as VyPopover } from './components/Popover.vue'
export { default as VyProgress } from './components/Progress.vue'
export { default as VyRadioGroup } from './components/RadioGroup.vue'
export { default as VyRating } from './components/Rating.vue'
export { default as VySelect } from './components/Select.vue'
export { default as VySeparator } from './components/Separator.vue'
export { default as VySkeleton } from './components/Skeleton.vue'
export { default as VySlider } from './components/Slider.vue'
export { default as VySortable } from './components/Sortable.vue'
export { default as VyStepper } from './components/Stepper.vue'
export { default as VySwipeAction } from './components/SwipeAction.vue'
export { default as VySwiper } from './components/Swiper.vue'
export { default as VySwitch } from './components/Switch.vue'
export { default as VyTabs } from './components/Tabs.vue'
export { default as VyTextarea } from './components/Textarea.vue'
export { default as VyToast } from './components/Toast.vue'
export { default as VyToggle } from './components/Toggle.vue'
export { default as VyToggleGroup } from './components/ToggleGroup.vue'
export { default as VyTray } from './components/Tray.vue'
export { default as VyTrayView } from './components/TrayView.vue'
export { type TrayContext, useTray } from './components/trayContext'
