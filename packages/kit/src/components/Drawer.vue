<script lang="ts">
import theme from '../theme/drawer'
import type { ClassValue, ThemeTV, VariantProps } from '../composables/useStyledComponent'

type DrawerTV = ThemeTV<typeof theme>
type DrawerVariants = VariantProps<DrawerTV>

export interface DrawerProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Side the drawer slides in from. */
  side?: DrawerVariants['side']
  /** Animate the drawer when opening/closing. */
  transition?: boolean
  /** Render the dim overlay behind the content. */
  overlay?: boolean
  /** When `false`, tapping the overlay does not close the drawer. */
  dismissible?: boolean
  /** Header title. Overridden by the `title` slot. */
  title?: string
  /** Header description. Overridden by the `description` slot. */
  description?: string
  /** Disable dragging on the underlying SheetContent. */
  dragDisabled?: boolean
  /** Show the drag-handle pill at the top of the drawer. @defaultValue `true` */
  handle?: boolean
  /** When `true`, only the `<SheetHandle>` is draggable; the drawer body does
   *  not respond to touch drag. @defaultValue `false` */
  handleOnly?: boolean
  /**
   * Snap fractions (0 → 1) forwarded to `SheetRoot`. Defaults to a single
   * three-quarter snap so a bottom drawer doesn't take over the viewport; pass
   * `[1]` for full-screen or e.g. `[0.4, 0.9]` for a resizable sheet.
   * @defaultValue `[0.75]`
   */
  snapPoints?: number[]
  /** Initial snap index when uncontrolled. */
  defaultSnapIndex?: number
  /**
   * When `true`, the footer translates upward to stay above the on-screen
   * keyboard on Lynx: the scaffold is wrapped in `KeyboardAwareRoot`, the footer
   * in `KeyboardAwareResponder`/`Trigger`, so any focused input inside the
   * footer drives the lift. No-op on web/jsdom.
   */
  keyboardAware?: boolean
  /** Forwarded to `KeyboardAwareRoot.forceAttach`. Defaults to `true` so the
   *  footer sticks to the keyboard's top edge (chat-style UX). */
  keyboardAwareForceAttach?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof DrawerTV['slots'], ClassValue>>
}

export interface DrawerEmits {
  (e: 'update:open', value: boolean): void
}

export interface DrawerSlots {
  /** Trigger content. `SheetTrigger` sets open to `true` on tap; do NOT also
   *  bind a `@tap` handler that sets open — use `v-model:open`. */
  default(props: { open: boolean }): any
  /** Full content override — replaces the default header/body/footer layout. */
  content(props: { close: () => void }): any
  /** Header region. */
  header(props: { close: () => void }): any
  /** Override the title text. */
  title(props?: {}): any
  /** Override the description text. */
  description(props?: {}): any
  /** Main body content. */
  body(props: { close: () => void }): any
  /** Footer region. */
  footer(props: { close: () => void }): any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  KeyboardAwareTrigger,
  SheetRoot,
  SheetTrigger,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
} from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<DrawerProps>(), {
  defaultOpen: false,
  transition: true,
  handle: true,
  handleOnly: false,
  overlay: true,
  dismissible: true,
  side: 'bottom',
  // Bottom drawers default to 75% of viewport, matching native UX
  // (UISheetPresentationController `medium`). `SheetRoot`'s own default is `[1]`.
  snapPoints: () => [0.75],
  defaultSnapIndex: 0,
  keyboardAware: false,
  keyboardAwareForceAttach: true,
})
const emit = defineEmits<DrawerEmits>()
const slots = defineSlots<DrawerSlots>()

const hasContentSlot = computed(() => !!slots.content)

function onOpenChange(value: boolean) {
  emit('update:open', value)
}

const close = () => onOpenChange(false)

const { ui } = useStyledComponent('drawer', theme, () => ({
  side: props.side,
  transition: props.transition,
}))
</script>

<template>
  <SheetRoot
    :open="props.open"
    :default-open="defaultOpen"
    :side="side"
    :snap-points="snapPoints"
    :default-snap-index="defaultSnapIndex"
    :enable-drag-to-close="dismissible"
    :handle-only="handleOnly"
    @update:open="onOpenChange"
  >
    <SheetTrigger>
      <slot :open="!!props.open" />
    </SheetTrigger>

    <SheetBackdrop
      v-if="overlay"
      :dismiss-on-tap="dismissible"
      :class="ui.overlay({ class: props.ui?.overlay })"
    />

    <SheetContent
      :drag-disabled="dragDisabled"
      :data-side="side"
      :class="ui.content({ class: props.ui?.content })"
    >
      <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

      <slot v-if="hasContentSlot" name="content" :close="close" />

      <template v-else>
        <!-- `keyboardAware` swaps the outer wrapper from a plain <view> to
             `KeyboardAwareRoot` (itself a Primitive view), so the scaffold's
             shape is identical either way. -->
        <component
          :is="keyboardAware ? KeyboardAwareRoot : 'view'"
          :force-attach="keyboardAware ? keyboardAwareForceAttach : undefined"
          :class="ui.scaffold({ class: props.ui?.scaffold })"
        >
          <view :class="ui.header({ class: props.ui?.header })">
            <slot name="header" :close="close">
              <view :class="ui.wrapper({ class: props.ui?.wrapper })">
                <slot name="title">
                  <text :class="ui.title({ class: props.ui?.title })">{{ title }}</text>
                </slot>
                <slot name="description">
                  <text :class="ui.description({ class: props.ui?.description })">{{ description }}</text>
                </slot>
              </view>
            </slot>
          </view>

          <view :class="ui.body({ class: props.ui?.body })">
            <slot name="body" :close="close" />
          </view>

          <component
            :is="keyboardAware ? KeyboardAwareResponder : 'view'"
            :class="ui.footer({ class: props.ui?.footer })"
          >
            <KeyboardAwareTrigger v-if="keyboardAware">
              <slot name="footer" :close="close" />
            </KeyboardAwareTrigger>
            <slot v-else name="footer" :close="close" />
          </component>
        </component>
      </template>
    </SheetContent>
  </SheetRoot>
</template>
