import type { Component } from 'vue'
import { Icon } from '@vyui/core'
import Accordion from './Accordion.vue'
import ActionSheet from './ActionSheet.vue'
import Alert from './Alert.vue'
import Avatar from './Avatar.vue'
import AvatarGroup from './AvatarGroup.vue'
import Badge from './Badge.vue'
import Button from './Button.vue'
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

/**
 * Canonical wrapper pattern — every styled component agent copies this shape.
 * Ported from nuxt/ui v3.0.2 component layout, adapted for our injection model
 * (no `#imports` virtual modules; theme comes from `useAppConfig`).
 *
 * ```vue
 * <script lang="ts">
 * import { tv, type VariantProps } from 'tailwind-variants'
 * import theme from '../theme/button'
 * import type { AppConfig } from '../types'
 *
 * // Resolve a per-app `tv` factory by merging the package default theme with
 * // user overrides pulled from `appConfig.ui.button`.
 * export const buildButton = (appConfig: AppConfig) => {
 *   const overrides = (appConfig.ui as any).button as Partial<typeof theme> | undefined
 *   return tv({ extend: tv(theme), ...(overrides || {}) })
 * }
 *
 * type ButtonVariants = VariantProps<ReturnType<typeof buildButton>>
 *
 * export interface ButtonProps {
 *   color?: ButtonVariants['color']
 *   variant?: ButtonVariants['variant']
 *   size?: ButtonVariants['size']
 *   disabled?: boolean
 *   class?: any
 *   ui?: Partial<Record<keyof ReturnType<typeof buildButton>['slots'], any>>
 * }
 *
 * export interface ButtonSlots {
 *   default(props?: {}): any
 *   leading(props?: {}): any
 *   trailing(props?: {}): any
 * }
 * </script>
 *
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { Button as CoreButton } from '@vyui/core'
 * import { useAppConfig } from '../composables/useAppConfig'
 *
 * const props = withDefaults(defineProps<ButtonProps>(), { })
 * defineSlots<ButtonSlots>()
 *
 * const appConfig = useAppConfig()
 * const ui = computed(() => buildButton(appConfig)({
 *   color: props.color,
 *   variant: props.variant,
 *   size: props.size,
 * }))
 * </script>
 *
 * <template>
 *   <CoreButton
 *     :disabled="disabled"
 *     :class="ui.base({ class: [props.class, props.ui?.base] })"
 *   >
 *     <slot />
 *   </CoreButton>
 * </template>
 * ```
 *
 * After authoring the wrapper, append it to `REGISTRY` below — the `VyUI`
 * plugin's `install()` loops over this map and calls `app.component(name, comp)`.
 */
export const REGISTRY: Record<string, Component> = {
  VyAccordion: Accordion,
  VyActionSheet: ActionSheet,
  VyAlert: Alert,
  VyAvatar: Avatar,
  VyAvatarGroup: AvatarGroup,
  VyBadge: Badge,
  VyButton: Button,
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
}
