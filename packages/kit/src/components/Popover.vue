<script lang="ts">
import theme from '../theme/popover'
import type { ThemeTV } from '../composables/useStyledComponent'
import type { SheetDirection } from '@vyui/core'

type PopoverTV = ThemeTV<typeof theme>

/**
 * Sub-object mirroring Nuxt UI's `content` prop — a single bag for popper
 * positioning knobs so call sites read cleanly:
 * `<UPopover :content="{ side: 'top', align: 'start', sideOffset: 4 }">`.
 *
 * Only used when `presentation === 'anchor'`. In sheet mode, use
 * `sheetSide` for viewport-edge placement.
 */
export interface PopoverContentSettings {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
}

export interface PopoverProps {
  /** Controlled open state — bind with `v-model:open`. */
  open?: boolean
  /** Convenience alias for `open` — bind with `v-model`. */
  modelValue?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /**
   * How to present the content on mobile.
   * - `'sheet'` (default): renders as an edge sheet via `SheetRoot` —
   *   native iOS / Material idiom for "tap → reveal floating panel" on
   *   touch screens. Drag-to-dismiss, snap physics, thumb-reach.
   * - `'anchor'`: docks the content next to the trigger (legacy popover
   *   behavior). Use on tablets / wide screens where pointer precision
   *   makes a tiny anchored panel reasonable.
   * @defaultValue 'sheet'
   */
  presentation?: 'sheet' | 'anchor'
  /**
   * Edge the sheet slides and drags from when `presentation` is `'sheet'`.
   * Anchor presentation keeps using `content.side` for trigger-relative
   * placement.
   * @defaultValue `'bottom'`
   */
  sheetSide?: SheetDirection
  /**
   * Snap fractions for `presentation: 'sheet'`. Forwarded to `SheetRoot`.
   * @defaultValue `[0.6]`
   */
  snapPoints?: number[]
  /** Show the drag-handle pill at the top of the sheet (`presentation: 'sheet'` only). @defaultValue `true` */
  handle?: boolean
  /**
   * Display mode. `hover` is accepted for API parity with nuxt/ui but
   * behaves the same as `click` — Lynx has no HoverCard primitive.
   * @defaultValue 'click'
   */
  mode?: 'click' | 'hover'
  /**
   * Positioning settings — only honoured in `presentation: 'anchor'`.
   * @defaultValue `{ side: 'bottom', sideOffset: 8 }`
   */
  content?: PopoverContentSettings
  /**
   * Display an arrow alongside the popover. Accepted for parity — no
   * `PopoverArrow` primitive on Lynx, so this is a no-op.
   * @defaultValue false
   */
  arrow?: boolean
  /**
   * Render the popover in a portal. Anchor-mode only; sheet mode is
   * always portalled through `OverlayRoot`.
   * @defaultValue true
   */
  portal?: boolean
  /**
   * Modality. When `true`, taps outside the popover are blocked from
   * reaching the underlying app. Defaults to `false` in anchor mode.
   * Sheet mode is always modal (the backdrop intercepts taps).
   * @defaultValue false
   */
  modal?: boolean
  /**
   * When `false`, the popover stays open on outside tap and a
   * `close:prevent` event is emitted instead.
   * @defaultValue true
   */
  dismissible?: boolean
  /**
   * Hover-mode delays (ms) — accepted for API parity, no-op on Lynx.
   */
  openDelay?: number
  closeDelay?: number
  class?: any
  ui?: Partial<Record<keyof PopoverTV['slots'], any>>
}

export interface PopoverEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
  /** Fired when `dismissible: false` blocked an outside-tap dismiss. */
  (e: 'close:prevent'): void
}

export interface PopoverSlots {
  /**
   * Trigger element. In sheet mode it's wrapped in `SheetTrigger`; in
   * anchor mode it's wrapped in `PopoverTrigger`. Both toggle open on tap.
   */
  default(props: { open: boolean }): any
  /**
   * Custom anchor element — anchor mode only. Sheet mode ignores this
   * slot (a viewport-edge sheet has no anchor).
   */
  anchor(props: { open: boolean }): any
  /** Popover content. `close` lets the slot dismiss programmatically. */
  content(props: { close: () => void }): any
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  SheetRoot,
  SheetTrigger,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  useElementRect,
} from '@vyui/core'
import { useStyledComponent } from '../composables/useStyledComponent'

const props = withDefaults(defineProps<PopoverProps>(), {
  presentation: 'sheet',
  snapPoints: () => [0.6],
  handle: true,
  portal: true,
  mode: 'click',
  modal: false,
  dismissible: true,
  arrow: false,
  openDelay: 0,
  closeDelay: 0,
  content: () => ({ side: 'bottom', sideOffset: 8 }),
})
const emit = defineEmits<PopoverEmits>()
defineSlots<PopoverSlots>()

const resolvedOpen = computed(() => props.open !== undefined ? props.open : props.modelValue)

const onUpdateOpen = (value: boolean) => {
  emit('update:open', value)
  emit('update:modelValue', value)
}

const close = () => onUpdateOpen(false)

const { ui } = useStyledComponent('popover', theme, () => ({}))

// --- Anchor-mode trigger measurement --------------------------------------
// Sheet mode skips this entirely (the sheet docks to the viewport bottom and
// has no anchor relationship with the trigger).
const triggerWrapRef = ref<any>(null)
const triggerRect = ref<{ top: number, left: number, bottom: number, right: number, width: number, height: number } | null>(null)

async function measureTrigger() {
  if (props.presentation !== 'anchor') return
  const el = triggerWrapRef.value
  if (!el) return
  const rect = await useElementRect(el)
  if (rect.width === 0 && rect.height === 0) return
  triggerRect.value = rect
}

watch(
  () => resolvedOpen.value,
  async (isOpen) => {
    if (!isOpen || props.presentation !== 'anchor') return
    await nextTick()
    await measureTrigger()
  },
)

const backdropStyle = computed<Record<string, any> | undefined>(() => {
  if (props.presentation !== 'anchor') return undefined
  const r = triggerRect.value
  if (!r) return resolvedOpen.value ? { opacity: '0' } : undefined

  const settings = props.content ?? {}
  const side = settings.side ?? 'bottom'
  const sideOffset = settings.sideOffset ?? 8
  const align = settings.align ?? 'start'

  const justify: Record<typeof side, string> = {
    top: 'center', bottom: 'center', left: 'flex-end', right: 'flex-start',
  }
  const alignItems: Record<typeof side, string> = {
    top: 'flex-end', bottom: 'flex-start', left: 'center', right: 'center',
  }

  const padding: Record<string, string> = {}
  if (side === 'bottom') padding.paddingTop = `${r.bottom + sideOffset}px`
  if (side === 'top')    padding.paddingBottom = `${Math.max(0, r.top - sideOffset)}px`
  if (side === 'right')  padding.paddingLeft = `${r.right + sideOffset}px`
  if (side === 'left')   padding.paddingRight = `${Math.max(0, r.left - sideOffset)}px`

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') {
      padding.paddingLeft = `${r.left}px`
      return { display: 'flex', alignItems: alignItems[side], justifyContent: 'flex-start', ...padding }
    }
    if (align === 'end') {
      padding.paddingRight = `${Math.max(0, r.right)}px`
      return { display: 'flex', alignItems: alignItems[side], justifyContent: 'flex-end', ...padding }
    }
  }

  return { display: 'flex', alignItems: alignItems[side], justifyContent: justify[side], ...padding }
})

function onInteractOutside(event: any) {
  if (props.dismissible) return
  event?.preventDefault?.()
  emit('close:prevent')
}
</script>

<template>
  <!-- SHEET MODE (default) — uses `SheetRoot` for state + drag. Touch-native
       presentation: tap trigger → sheet slides from a viewport edge, then
       drags back toward that edge to dismiss. Snap physics inherited from
       `SheetContent`. -->
  <SheetRoot
    v-if="presentation === 'sheet'"
    :open="resolvedOpen"
    :default-open="defaultOpen"
    :side="sheetSide"
    :snap-points="snapPoints"
    :enable-drag-to-close="dismissible"
    @update:open="onUpdateOpen"
  >
    <SheetTrigger>
      <slot :open="!!resolvedOpen" />
    </SheetTrigger>

    <SheetBackdrop :dismiss-on-tap="dismissible" />

    <SheetContent :class="ui.content({ class: props.ui?.content })">
      <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

      <slot name="content" :close="close" />
    </SheetContent>
  </SheetRoot>

  <!-- ANCHOR MODE — opt-in for tablet / wide-screen surfaces where pointer
       precision makes a tiny floating panel reasonable. Measures the trigger
       and docks the content next to it. -->
  <PopoverRoot
    v-else
    :open="resolvedOpen"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="onUpdateOpen"
  >
    <view
      ref="triggerWrapRef"
      @layoutchange="measureTrigger"
    >
      <slot v-if="$slots.anchor" name="anchor" :open="!!resolvedOpen" />
      <PopoverTrigger v-else :class="props.class">
        <slot :open="!!resolvedOpen" />
      </PopoverTrigger>
    </view>

    <PopoverPortal>
      <PopoverContent
        :backdrop-style="backdropStyle"
        :class="ui.content({ class: props.ui?.content })"
        @interact-outside="onInteractOutside"
      >
        <slot name="content" :close="close" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
