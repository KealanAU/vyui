// @vyui/kit — styled Vue-Lynx components built on @vyui/core.

export { VyUI } from './plugin'
export { provideVyUI } from './provide'

export { useAppConfig } from './composables/useAppConfig'
export { useComponentIcons, type UseComponentIconsProps } from './composables/useComponentIcons'

export {
  APP_CONFIG_KEY,
  type AppConfig,
  type VyUIPluginOptions,
  type DeepPartial,
  type ComponentThemes,
} from './types'

export { createTv, tv } from './utils/tv'

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

export { default as Accordion, default as VyAccordion } from './components/Accordion.vue'
export { default as ActionSheet, default as VyActionSheet } from './components/ActionSheet.vue'
export { default as Alert, default as VyAlert } from './components/Alert.vue'
// AspectRatio is pure layout with nothing to theme, so re-export the core
// primitive directly under a Vy* alias for discoverability (as with Icon).
export { AspectRatio, AspectRatio as VyAspectRatio, type AspectRatioProps } from '@vyui/core'
export { default as Avatar, default as VyAvatar } from './components/Avatar.vue'
export { default as AvatarGroup, default as VyAvatarGroup } from './components/AvatarGroup.vue'
export { default as Badge, default as VyBadge } from './components/Badge.vue'
export { default as Button, default as VyButton } from './components/Button.vue'
export { default as Card, default as VyCard } from './components/Card.vue'
export { default as Checkbox, default as VyCheckbox } from './components/Checkbox.vue'
export { default as Chip, default as VyChip } from './components/Chip.vue'
export { default as Combobox, default as VyCombobox } from './components/Combobox.vue'
export { default as Drawer, default as VyDrawer } from './components/Drawer.vue'
export { default as DropdownMenu, default as VyDropdownMenu } from './components/DropdownMenu.vue'
export { default as FeedList, default as VyFeedList } from './components/FeedList.vue'
export { default as Form, default as VyForm } from './components/Form.vue'
export { default as FormField, default as VyFormField } from './components/FormField.vue'
export { Icon, Icon as VyIcon, type IconProps } from '@vyui/core'
export { default as Input, default as VyInput } from './components/Input.vue'
// Re-export keyboard-aware primitives from core under Vy* aliases so consumers
// can lift any surface (not just <VyDrawer>) above the on-screen keyboard.
export {
  KeyboardAwareResponder as VyKeyboardAwareResponder,
  KeyboardAwareRoot as VyKeyboardAwareRoot,
  KeyboardAwareTrigger as VyKeyboardAwareTrigger,
} from '@vyui/core'
export { default as Island, default as VyIsland } from './components/Island.vue'
export { default as IslandButton, default as VyIslandButton } from './components/IslandButton.vue'
export { default as IslandGroup, default as VyIslandGroup } from './components/IslandGroup.vue'
export { default as Label, default as VyLabel } from './components/Label.vue'
export { default as Modal, default as VyModal } from './components/Modal.vue'
export { default as NumberField, default as VyNumberField } from './components/NumberField.vue'
export { default as PinInput, default as VyPinInput } from './components/PinInput.vue'
export { default as Placeholder, default as VyPlaceholder } from './components/Placeholder.vue'
export { default as Popover, default as VyPopover } from './components/Popover.vue'
export { default as Progress, default as VyProgress } from './components/Progress.vue'
export { default as RadioGroup, default as VyRadioGroup } from './components/RadioGroup.vue'
export { default as Rating, default as VyRating } from './components/Rating.vue'
export { default as Select, default as VySelect } from './components/Select.vue'
export { default as Separator, default as VySeparator } from './components/Separator.vue'
export { default as Skeleton, default as VySkeleton } from './components/Skeleton.vue'
export { default as Slider, default as VySlider } from './components/Slider.vue'
export { default as Sortable, default as VySortable } from './components/Sortable.vue'
export { default as Stepper, default as VyStepper } from './components/Stepper.vue'
export { default as SwipeAction, default as VySwipeAction } from './components/SwipeAction.vue'
export { default as Swiper, default as VySwiper } from './components/Swiper.vue'
export { default as Switch, default as VySwitch } from './components/Switch.vue'
export { default as Tabs, default as VyTabs } from './components/Tabs.vue'
export { default as Textarea, default as VyTextarea } from './components/Textarea.vue'
export { default as Toast, default as VyToast } from './components/Toast.vue'
export { default as Toggle, default as VyToggle } from './components/Toggle.vue'
export { default as ToggleGroup, default as VyToggleGroup } from './components/ToggleGroup.vue'
export { default as Tray, default as VyTray } from './components/Tray.vue'
export { default as TrayView, default as VyTrayView } from './components/TrayView.vue'
export { type TrayContext, useTray } from './components/trayContext'
