<script lang="ts">
import theme, { ICON_FG_SHADE } from '../theme/toast'
import type { ButtonProps } from './Button.vue'
import type { AvatarProps } from './Avatar.vue'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type ToastTV = ThemeTV<typeof theme>
type ToastVariants = VariantProps<ToastTV>

export interface ToastProps {
  /** Title text. Overridden by the `title` slot. */
  title?: string
  /** Description text. Overridden by the `description` slot. */
  description?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  /** Avatar rendered in the leading slot (loses to `icon`). */
  avatar?: AvatarProps
  color?: ToastVariants['color']
  orientation?: ToastVariants['orientation']
  /**
   * Sonner-style stacking: toasts collapse into an overlapping pile and fan out
   * when expanded — tap any toast to toggle. Requires the surrounding
   * `<ToastProvider>` and a `<ToastViewport>` anchored to match `stackFrom`.
   */
  stacked?: boolean
  /** Which edge the stack is pinned to — must match the `ToastViewport`
   *  `position`. `top` fans downward, `bottom` upward. Only used when `stacked`. */
  stackFrom?: 'top' | 'bottom'
  /**
   * Show a thin countdown bar that drains as the auto-dismiss timer runs.
   * Tracks `ToastRoot`'s `progress`, so it pauses while the stack is expanded
   * and is hidden when auto-dismiss is off.
   *
   * `true` inherits the toast `color`; an object overrides just the bar color,
   * either fixed (`{ color: 'success' }`) or a function of the remaining
   * fraction (`1` → `0`) so the bar recolors as it drains.
   */
  progress?: boolean | { color?: ToastVariants['color'] | ((progress: number) => ToastVariants['color']) }
  /** Enable swipe-to-dismiss (fling the toast away to close it). */
  swipe?: boolean
  /** Directions a swipe may dismiss in. `horizontal` (default) flings either
   *  way; `left` / `right` constrain it. Only used when `swipe`. */
  swipeDirection?: 'horizontal' | 'left' | 'right'
  /** Action buttons rendered after the body. */
  actions?: ButtonProps[]
  /** Show a close button. `true` renders the default, partial `ButtonProps`
   *  customize it, `false` hides it. */
  close?: boolean | Partial<ButtonProps>
  /** Iconify name for the close button. Defaults to `appConfig.ui.icons.close`. */
  closeIcon?: string
  class?: ClassValue
  ui?: Partial<Record<keyof ToastTV['slots'], ClassValue>>
}

export interface ToastEmits {
  (e: 'update:open', value: boolean): void
}

export interface ToastSlots {
  default(props?: {}): any
  /** Receives `iconColor` so custom icons can match the toast's resolved color. */
  leading(props: { iconColor: string }): any
  title(props?: {}): any
  description(props?: {}): any
  actions(props?: {}): any
  close(props: { ui: any }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { ToastRoot, ToastTitle, ToastDescription, ToastAction, ToastClose, ToastSwipe, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'
import { resolveColorHex } from '../utils/resolveColor'
import VyAvatar from './Avatar.vue'
import VyButton from './Button.vue'

const props = withDefaults(defineProps<ToastProps>(), {
  close: true,
  stacked: false,
  stackFrom: 'bottom',
  progress: false,
  swipe: false,
  swipeDirection: 'horizontal',
})
defineEmits<ToastEmits>()
defineSlots<ToastSlots>()

const appConfig = useAppConfig()

const { ui } = useStyledComponent('toast', theme, () => ({
  color: props.color,
  orientation: props.orientation,
  title: !!props.title,
}))

const resolvedCloseIcon = computed(() => props.closeIcon || appConfig.ui.icons?.close || 'i-lucide-x')

// Lynx SVG can't inherit currentColor — bake the toast color's `text-*-500`
// into the icon fill at render time (same pattern as Button/Input).
const iconColor = computed(() => resolveColorHex(appConfig, props.color ?? 'primary', ICON_FG_SHADE))

// --- Sonner-style stacking geometry -----------------------------------------
// Each toast self-positions from the shared stack data core's `ToastRoot`
// exposes. The transforms stay in the styled layer — `@vyui/core` ships the
// geometry, not the motion.
const STACK = {
  /** Vertical peek (px) of each toast behind the front one while collapsed. */
  collapsePeek: 16,
  /** Gap (px) between toasts once the stack is fanned out. */
  expandGap: 14,
  /** Scale lost per step back in the collapsed pile. */
  scaleStep: 0.06,
  /** Toasts deeper than this fade out while collapsed. */
  maxVisible: 3,
}

interface StackSlotProps {
  index: number
  count: number
  expanded: boolean
  heightBefore: number
}

function stackStyle(s: StackSlotProps): Record<string, any> | undefined {
  if (!props.stacked)
    return undefined

  const dir = props.stackFrom === 'top' ? 1 : -1
  const offset = s.expanded
    ? s.heightBefore + s.index * STACK.expandGap
    : s.index * STACK.collapsePeek
  const scale = s.expanded ? 1 : Math.max(1 - s.index * STACK.scaleStep, 0)
  const visible = s.expanded || s.index < STACK.maxVisible

  return {
    position: 'absolute',
    [props.stackFrom]: '0px',
    // Center horizontally with `left: 50%` + `translateX(-50%)`: Lynx doesn't
    // honor `margin: auto` for absolutely-positioned elements, and pinning
    // `left/right: 0` over-constrains the toast's own width.
    left: '50%',
    transform: `translateX(-50%) translateY(${dir * offset}px) scale(${scale})`,
    transformOrigin: `${props.stackFrom} center`,
    opacity: visible ? 1 : 0,
    zIndex: s.count - s.index,
    transition: 'transform 0.35s ease, opacity 0.35s ease',
  }
}

// Progress bar color: defaults to the toast color (the `color` variant bakes
// `bg-${c}-500` into `ui.progress`); an object `color` emits its own `bg-*-500`
// for tailwind-merge to override with. A function color is re-resolved per tick
// from the slot's `progress`. Safe for Lynx JIT — the color variant already
// emits every `bg-${c}-500` in the theme source.
function progressColorClass(value: number): string | undefined {
  if (typeof props.progress !== 'object')
    return undefined
  const color = typeof props.progress.color === 'function'
    ? props.progress.color(value)
    : props.progress.color
  return color ? `bg-${color}-500` : undefined
}

const closeButtonProps = computed<Partial<ButtonProps>>(() => {
  const overrides = typeof props.close === 'object' ? props.close : {}
  return {
    color: 'neutral',
    variant: 'ghost',
    size: 'md',
    icon: resolvedCloseIcon.value,
    ...overrides,
  }
})
</script>

<template>
  <ToastRoot
    v-slot="{ index: stackIndex, count: stackCount, expanded, heightBefore, toggleExpanded, progress: progressValue, duration: toastDuration }"
    as-child
    @update:open="$emit('update:open', $event)"
  >
    <!-- Outer shell (ToastRoot's `as-child` root): owns the stacking transform.
         `as-child` is required so this style can read ToastRoot's slot data.
         The visual card is a separate inner layer so swipe (MT `transform`)
         and stacking (BG `transform`) never fight over one element. -->
    <view
      :style="stacked ? stackStyle({ index: stackIndex, count: stackCount, expanded, heightBefore }) : undefined"
      @tap="stacked ? toggleExpanded() : undefined"
    >
    <component
      :is="swipe ? ToastSwipe : 'view'"
      :class="ui.root({ class: [props.class, props.ui?.root] })"
      v-bind="swipe ? { direction: swipeDirection } : {}"
    >
    <slot name="leading" :icon-color="iconColor">
      <VyIcon
        v-if="icon"
        :name="icon"
        :color="iconColor"
        :class="ui.icon({ class: props.ui?.icon })"
      />
      <VyAvatar
        v-else-if="avatar"
        v-bind="avatar"
        :class="ui.avatar({ class: props.ui?.avatar })"
      />
    </slot>

    <view :class="ui.wrapper({ class: props.ui?.wrapper })">
      <slot name="title">
        <ToastTitle v-if="title" :class="ui.title({ class: props.ui?.title })">{{ title }}</ToastTitle>
      </slot>
      <slot name="description">
        <ToastDescription v-if="description" :class="ui.description({ class: props.ui?.description })">{{ description }}</ToastDescription>
      </slot>

      <slot name="actions">
        <view v-if="orientation === 'vertical' && actions?.length" :class="ui.actions({ class: props.ui?.actions })">
          <ToastAction
            v-for="(action, index) in actions"
            :key="index"
            alt-text=""
          >
            <VyButton v-bind="action" />
          </ToastAction>
        </view>
      </slot>
    </view>

    <slot name="actions">
      <view v-if="orientation === 'horizontal' && actions?.length" :class="ui.actions({ class: props.ui?.actions })">
        <ToastAction
          v-for="(action, index) in actions"
          :key="index"
          alt-text=""
        >
          <VyButton v-bind="action" />
        </ToastAction>
      </view>
    </slot>

    <slot name="close" :ui="ui">
      <ToastClose v-if="close" as-child>
        <VyButton
          v-bind="closeButtonProps"
          :class="ui.close({ class: props.ui?.close })"
        />
      </ToastClose>
    </slot>

    <!-- Countdown bar: scaleX from the left edge keeps the full-width
         `inset-x-0` box from fighting an explicit width. -->
    <view
      v-if="progress && toastDuration > 0"
      :class="ui.progress({ class: [props.ui?.progress, progressColorClass(progressValue)] })"
      :style="{ transform: `scaleX(${progressValue})`, transformOrigin: 'left' }"
    />
    </component>
    </view>
  </ToastRoot>
</template>
