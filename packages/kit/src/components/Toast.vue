<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/toast'
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
  leading(props?: {}): any
  title(props?: {}): any
  description(props?: {}): any
  actions(props?: {}): any
  close(props: { ui: any }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import { ToastRoot, ToastTitle, ToastDescription, ToastAction, ToastClose, Icon as VyIcon } from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import VyAvatar from './Avatar.vue'
import VyButton from './Button.vue'

const props = withDefaults(defineProps<ToastProps>(), {
  close: true,
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
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:open="$emit('update:open', $event)"
  >
    <slot name="leading">
      <VyIcon
        v-if="icon"
        :name="icon"
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
  </ToastRoot>
</template>
