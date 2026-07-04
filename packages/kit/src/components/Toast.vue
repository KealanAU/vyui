<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme, { ICON_FG_SHADE } from '../theme/toast'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'
import type { ButtonProps } from './Button.vue'
import type { AvatarProps } from './Avatar.vue'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.toast`.
 */
export const buildToast = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).toast as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type ToastVariants = VariantProps<ReturnType<typeof buildToast>>

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
   * Sonner-style stacking. When `true`, toasts collapse into an overlapping
   * pile (front toast fully visible, the rest peeking out scaled-down behind
   * it) and fan out under each other when the stack is expanded — tap any
   * toast to toggle. Off by default: toasts render as a plain gapped column.
   *
   * Requires the surrounding `<ToastProvider>` (it owns the shared stack
   * order/expanded state) and a `<ToastViewport>` anchored to match `stackFrom`.
   */
  stacked?: boolean
  /**
   * Which edge the stack is pinned to — must match the `ToastViewport`
   * `position`. `top` fans toasts downward, `bottom` fans them upward.
   * Only used when `stacked`. Defaults to `bottom` (Sonner's default).
   */
  stackFrom?: 'top' | 'bottom'
  /**
   * Show a thin countdown bar along the bottom edge that drains as the
   * auto-dismiss timer runs. Tracks `ToastRoot`'s `progress`, so it pauses
   * while the stack is expanded and is hidden when auto-dismiss is off
   * (`duration: 0`).
   *
   * Pass `true` for the default (bar inherits the toast `color`), or an object
   * to override just the bar color independently — e.g. `{ color: 'success' }`.
   */
  progress?: boolean | { color?: ToastVariants['color'] }
  /** Enable swipe-to-dismiss (fling the toast away to close it). */
  swipe?: boolean
  /**
   * Directions a swipe may dismiss in. `horizontal` (default) flings either
   * way; `left` / `right` constrain it. Only used when `swipe`.
   */
  swipeDirection?: 'horizontal' | 'left' | 'right'
  /** Action buttons rendered after the body. */
  actions?: ButtonProps[]
  /**
   * Show a close button. Pass `true` to render the default, or partial
   * `ButtonProps` to customize it. Pass `false` to hide.
   */
  close?: boolean | Partial<ButtonProps>
  /** Iconify name for the close button. Defaults to `appConfig.ui.icons.close`. */
  closeIcon?: string
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildToast>['slots'], any>>
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

const ui = computed(() => buildToast(appConfig)({
  color: props.color,
  orientation: props.orientation,
  title: !!props.title,
}))

const resolvedCloseIcon = computed(() => props.closeIcon || appConfig.ui.icons?.close || 'i-lucide-x')

// Lynx SVG can't inherit currentColor — bake the toast color's `text-*-500`
// into the icon fill at render time (same pattern as Button/Input).
const iconColor = computed(() => resolveColorHex(appConfig, props.color ?? 'primary', ICON_FG_SHADE))

// --- Sonner-style stacking geometry -------------------------------------
// Each toast self-positions from the shared stack data the core `ToastRoot`
// exposes (index from the front, the combined height of the toasts ahead of
// it, expanded state). We keep the transforms here in the styled layer —
// `@vyui/core` deliberately ships the geometry, not the motion.
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
    // Fanned out: shift past the real height of the toasts in front + a gap.
    ? s.heightBefore + s.index * STACK.expandGap
    // Collapsed: every toast peeks a fixed amount behind the front one.
    : s.index * STACK.collapsePeek
  const scale = s.expanded ? 1 : Math.max(1 - s.index * STACK.scaleStep, 0)
  const visible = s.expanded || s.index < STACK.maxVisible

  return {
    position: 'absolute',
    [props.stackFrom]: '0px',
    // Center horizontally with `left: 50%` + `translateX(-50%)`: Lynx doesn't
    // honor `margin: auto` for absolutely-positioned elements, and pinning
    // `left/right: 0` over-constrains the toast's own width. This keeps each
    // toast at the full default width, centered like the unstacked column.
    left: '50%',
    transform: `translateX(-50%) translateY(${dir * offset}px) scale(${scale})`,
    transformOrigin: `${props.stackFrom} center`,
    opacity: visible ? 1 : 0,
    // Front toast (index 0) paints on top of the pile.
    zIndex: s.count - s.index,
    transition: 'transform 0.35s ease, opacity 0.35s ease',
  }
}

// Progress bar color: defaults to the toast color (the `color` variant already
// bakes `bg-${c}-500` into `ui.progress`); when `progress` is an object with a
// `color`, emit that `bg-*-500` so tailwind-merge overrides the variant's. The
// class is safe for Lynx JIT because the color variant already emits every
// `bg-${c}-500` in the theme source.
const progressColorClass = computed(() => {
  const color = typeof props.progress === 'object' ? props.progress.color : undefined
  return color ? `bg-${color}-500` : undefined
})

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
         `as-child` is required so this style can read the slot data ToastRoot
         exposes — slot props aren't in scope on ToastRoot's own attributes.
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
         `inset-x-0` box from fighting an explicit width. Hidden when
         auto-dismiss is off. -->
    <view
      v-if="progress && toastDuration > 0"
      :class="ui.progress({ class: [props.ui?.progress, progressColorClass] })"
      :style="{ transform: `scaleX(${progressValue})`, transformOrigin: 'left' }"
    />
    </component>
    </view>
  </ToastRoot>
</template>
