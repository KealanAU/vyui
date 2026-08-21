import type { Component } from 'vue'
import { AspectRatio, Icon } from '@vyui/core'
import Accordion from './Accordion.vue'
import Alert from './Alert.vue'
import App from './App.vue'
import Avatar from './Avatar.vue'
import AvatarGroup from './AvatarGroup.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
import Calendar from './Calendar.vue'
import Card from './Card.vue'
import Checkbox from './Checkbox.vue'
import Chip from './Chip.vue'
import Combobox from './Combobox.vue'
import Drawer from './Drawer.vue'
import DropdownMenu from './DropdownMenu.vue'
import FeedList from './FeedList.vue'
import Form from './Form.vue'
import FormField from './FormField.vue'
import Input from './Input.vue'
import Island from './Island.vue'
import IslandButton from './IslandButton.vue'
import IslandGroup from './IslandGroup.vue'
import Label from './Label.vue'
import Modal from './Modal.vue'
import NumberField from './NumberField.vue'
import PinInput from './PinInput.vue'
import Popover from './Popover.vue'
import Progress from './Progress.vue'
import RadioGroup from './RadioGroup.vue'
import Rating from './Rating.vue'
import Select from './Select.vue'
import Separator from './Separator.vue'
import Skeleton from './Skeleton.vue'
import Slider from './Slider.vue'
import Sortable from './Sortable.vue'
import Stepper from './Stepper.vue'
import SwipeAction from './SwipeAction.vue'
import Swiper from './Swiper.vue'
import Switch from './Switch.vue'
import Tabs from './Tabs.vue'
import Textarea from './Textarea.vue'
import Toast from './Toast.vue'
import Toggle from './Toggle.vue'
import ToggleGroup from './ToggleGroup.vue'
import Tray from './Tray.vue'
import TrayView from './TrayView.vue'

// New wrapper? Copy Button.vue (theme + `ThemeTV`/`useStyledComponent`), then add
// it here — the VyUI plugin's `install()` loops this map into `app.component()`.
// `satisfies` (not a `: Record<string, Component>` annotation) keeps each key's
// concrete component type in `typeof REGISTRY` while still checking the shape.
export const REGISTRY = {
  VyAccordion: Accordion,
  VyAlert: Alert,
  VyApp: App,
  // Pure layout primitive — re-exported from @vyui/core (nothing to theme),
  // registered here so global usage matches the other Vy* components.
  VyAspectRatio: AspectRatio,
  VyAvatar: Avatar,
  VyAvatarGroup: AvatarGroup,
  VyBadge: Badge,
  VyButton: Button,
  VyCalendar: Calendar,
  VyCard: Card,
  VyCheckbox: Checkbox,
  VyChip: Chip,
  VyCombobox: Combobox,
  VyDrawer: Drawer,
  VyDropdownMenu: DropdownMenu,
  VyFeedList: FeedList,
  VyForm: Form,
  VyFormField: FormField,
  VyIcon: Icon,
  VyInput: Input,
  VyIsland: Island,
  VyIslandButton: IslandButton,
  VyIslandGroup: IslandGroup,
  VyLabel: Label,
  VyModal: Modal,
  VyNumberField: NumberField,
  VyPinInput: PinInput,
  VyPopover: Popover,
  VyProgress: Progress,
  VyRadioGroup: RadioGroup,
  VyRating: Rating,
  VySelect: Select,
  VySeparator: Separator,
  VySkeleton: Skeleton,
  VySlider: Slider,
  VySortable: Sortable,
  VyStepper: Stepper,
  VySwipeAction: SwipeAction,
  VySwiper: Swiper,
  VySwitch: Switch,
  VyTabs: Tabs,
  VyTextarea: Textarea,
  VyToast: Toast,
  VyToggle: Toggle,
  VyToggleGroup: ToggleGroup,
  VyTray: Tray,
  VyTrayView: TrayView,
} satisfies Record<string, Component>
