<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/tray'
import type { SheetDirection } from '@vyui/core'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.tray`.
 */
export const buildTray = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).tray as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
}

type TrayVariants = VariantProps<ReturnType<typeof buildTray>>

export interface TrayProps {
  /** Controlled open state — bind with `v-model:open`. */
  open?: boolean
  /** Convenience alias for `open` — bind with `v-model`. */
  modelValue?: boolean
  /** Initial open state when uncontrolled. @defaultValue `false` */
  defaultOpen?: boolean
  /**
   * Panel chrome. `floating` is a detached card hovering with a gap and border
   * on all sides (the tray's signature look); `flush` is a classic bottom
   * sheet glued to the screen edges (same silhouette as `Drawer`).
   * @defaultValue `'floating'`
   */
  variant?: TrayVariants['variant']
  /**
   * Id of the view shown when the tray opens (and returned to after close).
   * Must match a `<VyTrayView :id>`. @defaultValue `'default'`
   */
  defaultView?: string
  /**
   * Controlled current view — bind with `v-model:view`. Usually left
   * uncontrolled and driven via triggers / `useTray().setView`.
   */
  view?: string
  /**
   * Edge the tray slides and drags from. Trays are almost always `bottom`;
   * exposed for parity with the other sheet-family components.
   * @defaultValue `'bottom'`
   */
  side?: SheetDirection
  /** Render the dim overlay behind the tray. @defaultValue `true` */
  overlay?: boolean
  /** Tapping the overlay or dragging down closes the tray. @defaultValue `true` */
  dismissible?: boolean
  /** Show the drag handle at the top of the tray. @defaultValue `true` */
  handle?: boolean
  /**
   * Height-morph + slide/settle duration in ms. Drives both the per-view
   * height tween and the core sheet's open/close motion.
   * @defaultValue `300`
   */
  duration?: number
  /**
   * Keyboard handling on Lynx (no-op on web/jsdom — there is no platform
   * keyboard event). When enabled, the whole panel rises above the on-screen
   * keyboard: the panel is bottom-anchored and content-hugging, so growing
   * its bottom padding by the keyboard height pushes handle/body/footer up
   * while the panel background fills behind the keyboard. (Padding, not
   * `transform` — the sheet's MT drag worklets own the panel transform.)
   *  - `'lift'` — rise only. Best for short/medium trays.
   *  - `'scroll'` (or `true`) — rise, plus the body becomes a keyboard-aware
   *    scroll region that keeps the focused input in view. It only scrolls
   *    once its height is bounded — cap it via the `bodyScroll` ui slot
   *    (e.g. `max-h-*`). Best for tall trays.
   *  - `false` — no keyboard handling.
   * Inputs anywhere inside (body or footer) register themselves; no
   * `KeyboardAwareTrigger` wrapping needed. @defaultValue `false`
   */
  keyboardAware?: boolean | 'lift' | 'scroll'
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildTray>['slots'], any>>
}

export interface TrayEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:view', value: string): void
}

export interface TraySlotProps {
  /** Open the tray, optionally to a specific view. */
  open: (view?: string) => void
  /** Close the tray. */
  close: () => void
  /** Navigate to `id`, pushing the current view onto the back stack. */
  setView: (id: string) => void
  /** Pop the back stack. No-op when `canGoBack` is false. */
  goBack: () => void
  /** Whether the tray is open. */
  visible: boolean
  /** Current view id. */
  view: string
  /** True when `goBack()` has somewhere to return to. */
  canGoBack: boolean
}

export interface TraySlots {
  /**
   * In-flow trigger. Rendered where `<VyTray>` sits; tapping it opens the tray
   * to `defaultView`. For opening to a specific view, use `useTray()` or a
   * `@tap` that calls the slot's `open(id)`.
   */
  trigger(props: TraySlotProps): any
  /** The views — one or more `<VyTrayView :id>` children. */
  default(props: TraySlotProps): any
  /** Persistent footer, mounted below the morph region so it survives view swaps. */
  footer(props: TraySlotProps): any
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  KeyboardAwareResponder,
  KeyboardAwareRoot,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  SheetRoot,
  useId,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { provideTrayContext } from './trayContext'

const props = withDefaults(defineProps<TrayProps>(), {
  defaultOpen: false,
  defaultView: 'default',
  side: 'bottom',
  overlay: true,
  dismissible: true,
  handle: true,
  duration: 300,
  keyboardAware: false,
})
const emit = defineEmits<TrayEmits>()
defineSlots<TraySlots>()

const appConfig = useAppConfig()

// Hand-rolled controlled/uncontrolled split for `open` and `view` — vue-lynx
// 0.4.0 lacks `defineModel`'s `mergeModels` runtime export (same reason
// `Island` hand-rolls it). The controlled prop wins when bound; the local ref
// tracks state otherwise, and writers update the local ref AND emit.
const localOpen = ref(props.defaultOpen)
const localView = ref(props.defaultView)

const resolvedOpen = computed(() => (props.open !== undefined ? props.open : props.modelValue) ?? localOpen.value)
const resolvedView = computed(() => props.view ?? localView.value)

// Back-navigation history. `setView` pushes the current view; `goBack` pops.
const stack = ref<string[]>([])
const canGoBack = computed(() => stack.value.length > 0)

function setOpen(next: boolean) {
  localOpen.value = next
  emit('update:open', next)
  emit('update:modelValue', next)
  if (!next) {
    // Reset navigation on close so a reopen starts clean at `defaultView`, and
    // the height morph re-measures from the natural height rather than a stale
    // px value carried over from the last session.
    stack.value = []
    setViewInternal(props.defaultView)
    morphHeight.value = null
  }
}

function setViewInternal(id: string) {
  localView.value = id
  emit('update:view', id)
}

function open(view?: string) {
  stack.value = []
  setViewInternal(view ?? props.defaultView)
  setOpen(true)
}
function close() { setOpen(false) }

function setView(id: string) {
  if (id === resolvedView.value) return
  stack.value.push(resolvedView.value)
  setViewInternal(id)
}

function goBack() {
  const prev = stack.value.pop()
  if (prev !== undefined) setViewInternal(prev)
}

provideTrayContext({
  view: resolvedView,
  visible: resolvedOpen,
  canGoBack,
  open,
  close,
  setView,
  goBack,
})

// -- Keyboard awareness --------------------------------------------------------
// `true` is an alias for `'scroll'` — the mode that suits most trays (the
// panel rises either way; scroll additionally bounds the body).
const kaMode = computed<false | 'lift' | 'scroll'>(() =>
  props.keyboardAware === true ? 'scroll' : (props.keyboardAware || false),
)

// Unique per instance — the root scrolls the responder's scroll-view by id,
// and two open trays sharing core's default `'scrollview'` id would collide.
const bodyScrollId = useId(undefined, 'vy-tray-body-scroll')

// Height reported by the tray's KeyboardAwareRoot (fed by the focused input's
// element @keyboard event — the only keyboard signal under vue-lynx).
const keyboardHeight = ref(0)
function onKeyboardHeight(heightInPx: number) {
  keyboardHeight.value = heightInPx
}

// The rise: pad the panel's bottom by the keyboard height. The panel is
// bottom-anchored and hugs content, so the padding extends it UPWARD —
// handle/body/footer clear the keyboard while the panel background fills in
// behind it. Padding rather than `transform`/`bottom` because the sheet's MT
// drag worklets own the panel transform (BG style patches are replace-all and
// would fight them), and padding needs no knowledge of the variant's inset.
const panelKeyboardStyle = computed(() => (kaMode.value
  ? {
      paddingBottom: `${keyboardHeight.value}px`,
      transition: 'padding-bottom 0.25s ease-out',
    }
  : {}))

// -- Height morph ------------------------------------------------------------
// The panel hugs content (core `fitContent`); the `morph` container carries an
// explicit px height that CSS-transitions between views. `null` before the
// first measure = natural (auto) height, so the first paint doesn't animate
// from zero. `viewport`'s @layoutchange feeds the measured natural height in.
const morphHeight = ref<number | null>(null)

// While the keyboard is up, the scroll responder grows a spacer inside the
// viewport; that @layoutchange must not become a morph target or the tray
// grows instead of scrolling — morph updates freeze until the keyboard closes.
function onViewportLayout(event: { detail?: { height?: number } } | undefined) {
  if (keyboardHeight.value > 0) return
  const h = event?.detail?.height
  if (typeof h === 'number' && h > 0) morphHeight.value = Math.round(h)
}

const morphStyle = computed(() => ({
  ...(morphHeight.value !== null ? { height: `${morphHeight.value}px` } : {}),
  transitionDuration: `${props.duration}ms`,
}))

const slotProps = computed<TraySlotProps>(() => ({
  open,
  close,
  setView,
  goBack,
  visible: resolvedOpen.value,
  view: resolvedView.value,
  canGoBack: canGoBack.value,
}))

const ui = computed(() => buildTray(appConfig)({ variant: props.variant }))
</script>

<template>
  <SheetRoot
    :open="resolvedOpen"
    :side="side"
    :snap-points="[1]"
    :duration="duration"
    :enable-drag-to-close="dismissible"
    @update:open="setOpen"
  >
    <view
      v-if="!!$slots.trigger"
      data-vyui-tray-trigger
      @tap="open()"
    >
      <slot name="trigger" v-bind="slotProps" />
    </view>

    <SheetBackdrop
      v-if="overlay"
      :dismiss-on-tap="dismissible"
      :class="ui.overlay({ class: props.ui?.overlay })"
    />

    <SheetContent
      fit-content
      :class="ui.content({ class: [props.class, props.ui?.content] })"
      :style="panelKeyboardStyle"
    >
      <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

      <!-- One KeyboardAwareRoot spans body + footer so any input inside
           self-registers and its @keyboard event drives `keyboardHeight`
           (→ the panel's padding rise). Renders as a plain view when
           keyboard awareness is off. -->
      <component
        :is="kaMode ? KeyboardAwareRoot : 'view'"
        v-on="kaMode ? { keyboardHeightChange: onKeyboardHeight } : {}"
      >
        <view :class="ui.morph({ class: props.ui?.morph })" :style="morphStyle">
          <view
            :class="ui.viewport({ class: props.ui?.viewport })"
            @layoutchange="onViewportLayout"
          >
            <view :class="ui.body({ class: props.ui?.body })">
              <!-- 'scroll': the body is a bounded scroll region the root
                   scrolls to keep the focused input in view once the panel
                   has risen. -->
              <KeyboardAwareResponder
                v-if="kaMode === 'scroll'"
                mode="scroll-view"
                :scrollview-id="bodyScrollId"
                :scroll-view-class="ui.bodyScroll({ class: props.ui?.bodyScroll })"
              >
                <slot v-bind="slotProps" />
              </KeyboardAwareResponder>
              <slot v-else v-bind="slotProps" />
            </view>
          </view>
        </view>

        <!-- Persistent footer: outside `morph`, so it never unmounts or
             animates across view swaps. It rides the panel's padding rise —
             no responder of its own. -->
        <view v-if="!!$slots.footer" :class="ui.footer({ class: props.ui?.footer })">
          <slot name="footer" v-bind="slotProps" />
        </view>
      </component>
    </SheetContent>
  </SheetRoot>
</template>
