<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/drawer'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.drawer`.
 */
export const buildDrawer = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).drawer as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type DrawerVariants = VariantProps<ReturnType<typeof buildDrawer>>

export interface DrawerProps {
  /** Controlled open state. */
  open?: boolean
  /** v-model alias for `open` (Nuxt UI parity). */
  modelValue?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /**
   * Side the drawer slides in from. NOTE: the underlying core `Sheet*` is
   * a bottom-sheet — this drives `data-side` for styling but the physical
   * drag direction is fixed. Map `direction` from Nuxt UI's Drawer to
   * the same prop for parity.
   */
  side?: DrawerVariants['side']
  /** Alias for `side` — matches Nuxt UI's Drawer (vaul) API. */
  direction?: DrawerVariants['side']
  /** Animate the drawer when opening/closing. */
  transition?: boolean
  /** Render the dim overlay behind the content. */
  overlay?: boolean
  /** Render the drawer in a portal. Currently advisory — core `SheetContent` mounts in place. */
  portal?: boolean
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
  /**
   * Snap fractions (0 → 1) forwarded to `SheetRoot`. Defaults to a single
   * three-quarter-height snap so a bottom drawer doesn't take over the entire
   * viewport. Pass `[1]` for a full-screen drawer or e.g. `[0.4, 0.9]` for a
   * resizable sheet.
   * @defaultValue `[0.75]`
   */
  snapPoints?: number[]
  /** Initial snap index when uncontrolled. */
  defaultSnapIndex?: number
  /**
   * When `true`, the footer translates upward to stay above the on-screen
   * keyboard on Lynx. Internally wraps the scaffold in `KeyboardAwareRoot`,
   * the footer in `KeyboardAwareResponder`, and the footer slot in
   * `KeyboardAwareTrigger` — any focused `VyInput`/`VyTextarea` inside the
   * footer drives the lift. No-op on web/jsdom (no platform keyboard event).
   */
  keyboardAware?: boolean
  /**
   * Forwarded to `KeyboardAwareRoot.forceAttach`. Defaults to `true` so the
   * footer sticks to the keyboard's top edge (chat-style UX). Set `false`
   * for forms where the input only needs to be barely above the keyboard.
   */
  keyboardAwareForceAttach?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildDrawer>['slots'], any>>
}

export interface DrawerEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
}

export interface DrawerSlots {
  /**
   * Trigger content. `SheetTrigger` sets open to `true` on tap; do NOT bind
   * a `@tap` handler on the slotted child that also sets open — use
   * `v-model:open` (or `v-model`).
   */
  default(props: { open: boolean }): any
  /**
   * Full content override — replaces the default header/body/footer layout.
   * Matches the Nuxt UI escape hatch: pass arbitrary children when the
   * standard slot scaffold doesn't fit.
   */
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
import { computed, useSlots } from 'vue'
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
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<DrawerProps>(), {
  defaultOpen: false,
  transition: true,
  handle: true,
  overlay: true,
  portal: true,
  dismissible: true,
  side: 'bottom',
  // Bottom drawers default to 75% of viewport — matches native UX
  // (UISheetPresentationController `medium`, Material `expanded` bottom sheet).
  // `SheetRoot`'s own default is `[1]` (full screen); without this override
  // every `<VyDrawer>` would take over the entire viewport on open.
  snapPoints: () => [0.75],
  defaultSnapIndex: 0,
  keyboardAware: false,
  keyboardAwareForceAttach: true,
})
const emit = defineEmits<DrawerEmits>()
const slots = defineSlots<DrawerSlots>()

const appConfig = useAppConfig()

const hasContentSlot = computed(() => !!slots.content)

const resolvedSide = computed(() => props.direction || props.side || 'bottom')

const resolvedOpen = computed(() => (props.open !== undefined ? props.open : props.modelValue))

function onOpenChange(value: boolean) {
  emit('update:open', value)
  emit('update:modelValue', value)
}

// Slot prop for programmatic dismiss inside body/footer/content — Nuxt UI
// parity (`<template #footer="{ close }">…@click="close"…`).
const close = () => onOpenChange(false)

const ui = computed(() => buildDrawer(appConfig)({
  side: resolvedSide.value,
  transition: props.transition,
}))
</script>

<template>
  <SheetRoot
    :open="resolvedOpen"
    :default-open="defaultOpen"
    :snap-points="snapPoints"
    :default-snap-index="defaultSnapIndex"
    :enable-drag-to-close="dismissible"
    @update:open="onOpenChange"
  >
    <SheetTrigger>
      <slot :open="!!resolvedOpen" />
    </SheetTrigger>

    <SheetBackdrop
      v-if="overlay"
      :dismiss-on-tap="dismissible"
      :class="ui.overlay({ class: props.ui?.overlay })"
    />

    <SheetContent
      :drag-disabled="dragDisabled"
      :data-side="resolvedSide"
      :class="ui.content({ class: props.ui?.content })"
    >
      <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

      <slot v-if="hasContentSlot" name="content" :close="close" />

      <template v-else>
        <!-- `keyboardAware` swaps the outer wrapper from a plain <view> to
             `KeyboardAwareRoot` (which is itself a Primitive view) so the
             scaffold's DOM shape is identical either way. The Responder /
             Trigger pair is only mounted when keyboard awareness is on. -->
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
