<script lang="ts">
import theme from '../theme/modal'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'
import type { ButtonProps } from './Button.vue'

type ModalTV = ThemeTV<typeof theme>
type ModalVariants = VariantProps<ModalTV>

export interface ModalProps {
  /** Controlled open state — bind with `v-model:open`. */
  open?: boolean
  /** Convenience alias for `open` — bind with `v-model`. */
  modelValue?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Modal title text. Overridden by the `title` slot. */
  title?: string
  /** Modal description text. Overridden by the `description` slot. */
  description?: string
  /**
   * Render an overlay behind the modal.
   * @defaultValue true
   */
  overlay?: boolean
  /**
   * Animate the modal when opening or closing.
   * @defaultValue true
   */
  transition?: ModalVariants['transition']
  /**
   * Render the modal in a portal. The `@vyui/core` `DialogPortal` is a
   * transparent pass-through on Lynx (portaling is handled by `OverlayRoot`);
   * the prop is kept for API parity but always wraps content in `DialogPortal`
   * to keep the render tree shape stable.
   * @defaultValue true
   */
  portal?: boolean
  /**
   * Display a close button to dismiss the modal. Pass an object to forward
   * props to the underlying `VyButton`.
   * @defaultValue true
   */
  close?: boolean | Partial<ButtonProps>
  /**
   * Iconify name for the close button.
   * @defaultValue appConfig.ui.icons.close
   */
  closeIcon?: string
  /**
   * When `false`, the modal will not close when interacting outside.
   * @defaultValue true
   */
  dismissible?: boolean
  class?: any
  ui?: Partial<Record<keyof ModalTV['slots'], any>>
}

export interface ModalEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
  /** Fired when `dismissible: false` blocked an outside-tap dismiss. */
  (e: 'close:prevent'): void
}

export interface ModalSlots {
  /**
   * Trigger element — wrapped in `DialogTrigger`. `DialogTrigger` toggles
   * open state on tap; do NOT bind a `@tap` handler on the slotted child
   * that also sets the open state — it will race with the trigger and
   * cause a double-toggle. Use `v-model:open` (or `v-model`) instead.
   */
  default(props: { open: boolean }): any
  /**
   * Full content override — replaces the default header/body/footer layout
   * (including the close button, which lives in the header). Matches the
   * Nuxt UI Modal `#content` escape hatch.
   */
  content(props: { close: () => void }): any
  /** Header region. Replaces title / description / close. */
  header(props: { close: () => void }): any
  body(props: { close: () => void }): any
  footer(props: { close: () => void }): any
  title(props?: {}): any
  description(props?: {}): any
  /** Override the default close button. */
  close(props: { ui: ReturnType<ModalTV> }): any
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'
import VyButton from './Button.vue'

const props = withDefaults(defineProps<ModalProps>(), {
  close: true,
  portal: true,
  overlay: true,
  transition: true,
  dismissible: true,
})
const emit = defineEmits<ModalEmits>()
const slots = defineSlots<ModalSlots>()

const appConfig = useAppConfig()

// When the caller supplies `#content`, that slot fully replaces the default
// header / body / footer scaffold — matches Nuxt UI's Modal where `#content`
// is the "render whatever you want inside the dialog" escape hatch.
const hasContentSlot = computed(() => !!slots.content)

// `open` is the canonical prop; `modelValue` is a convenience alias so users
// can `v-model` directly. Whichever is defined wins, with `open` taking
// precedence when both are passed.
const resolvedOpen = computed(() => props.open !== undefined ? props.open : props.modelValue)

const onUpdateOpen = (value: boolean) => {
  emit('update:open', value)
  emit('update:modelValue', value)
}

// Passed to body / footer / content / header slots so callers can dismiss the
// modal from inside their custom layout (matches Nuxt UI's `{ close }` slot
// prop — `<template #footer="{ close }">…@click="close"…`).
const close = () => onUpdateOpen(false)

// Mirrors Popover: dismissible defaults true; when false, swallow the
// outside-tap dismiss and surface it as `close:prevent`.
function onInteractOutside(event: any) {
  if (props.dismissible) return
  event?.preventDefault?.()
  emit('close:prevent')
}

const { ui } = useStyledComponent('modal', theme, () => ({
  transition: props.transition,
}))

const resolvedCloseIcon = computed(() => props.closeIcon || appConfig.ui.icons?.close || 'i-lucide-x')
</script>

<template>
  <DialogRoot
    :open="resolvedOpen"
    :default-open="defaultOpen"
    @update:open="onUpdateOpen"
  >
    <DialogTrigger :class="props.class">
      <slot :open="!!resolvedOpen" />
    </DialogTrigger>

    <DialogPortal>
      <DialogContent
        :backdrop-class="overlay ? ui.overlay({ class: props.ui?.overlay }) : undefined"
        :class="ui.content({ class: props.ui?.content })"
        @interact-outside="onInteractOutside"
      >
        <slot v-if="hasContentSlot" name="content" :close="close" />

        <template v-else>
          <view :class="ui.header({ class: props.ui?.header })">
            <slot name="header" :close="close">
              <view :class="ui.wrapper({ class: props.ui?.wrapper })">
                <DialogTitle :class="ui.title({ class: props.ui?.title })">
                  <slot name="title">{{ title }}</slot>
                </DialogTitle>

                <DialogDescription :class="ui.description({ class: props.ui?.description })">
                  <slot name="description">{{ description }}</slot>
                </DialogDescription>
              </view>

              <DialogClose v-if="props.close">
                <slot name="close" :ui="ui">
                  <VyButton
                    :icon="resolvedCloseIcon"
                    size="md"
                    color="neutral"
                    variant="ghost"
                    v-bind="(typeof props.close === 'object' ? props.close : {})"
                    :class="ui.close({ class: props.ui?.close })"
                  />
                </slot>
              </DialogClose>
            </slot>
          </view>

          <view :class="ui.body({ class: props.ui?.body })">
            <slot name="body" :close="close" />
          </view>

          <view :class="ui.footer({ class: props.ui?.footer })">
            <slot name="footer" :close="close" />
          </view>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
