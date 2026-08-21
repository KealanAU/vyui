<script lang="ts">
import theme from '../theme/popover'
import type { ClassValue, ThemeTV } from '../composables/useStyledComponent'
import type { SheetDirection } from '@vyui/core'

type PopoverTV = ThemeTV<typeof theme>

/**
 * Sub-object mirroring Nuxt UI's `content` prop — one bag for popper
 * positioning knobs. Only used when `presentation === 'anchor'`; in sheet mode
 * use `sheetSide`.
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
   * - `'sheet'` (default): renders as an edge sheet via `SheetRoot`, with
   *   drag-to-dismiss and snap physics.
   * - `'anchor'`: docks the content next to the trigger, for tablets / wide
   *   screens where pointer precision makes a tiny panel reasonable.
   * @defaultValue 'sheet'
   */
  presentation?: 'sheet' | 'anchor'
  /** Edge the sheet slides and drags from when `presentation` is `'sheet'`.
   *  Anchor presentation uses `content.side` instead. @defaultValue `'bottom'` */
  sheetSide?: SheetDirection
  /** Snap fractions for `presentation: 'sheet'`. Forwarded to `SheetRoot`. @defaultValue `[0.6]` */
  snapPoints?: number[]
  /** Show the drag-handle pill at the top of the sheet (`presentation: 'sheet'` only). @defaultValue `true` */
  handle?: boolean
  /** Positioning settings — only honoured in `presentation: 'anchor'`.
   *  @defaultValue `{ side: 'bottom', sideOffset: 8 }` */
  content?: PopoverContentSettings
  /**
   * Modality. When `true`, taps outside are blocked from reaching the app and
   * assistive tech is confined to the popover. Sheet mode is always modal (the
   * backdrop intercepts taps).
   * @defaultValue false
   */
  modal?: boolean
  /** When `false`, the popover stays open on outside tap and emits
   *  `close:prevent` instead. @defaultValue true */
  dismissible?: boolean
  class?: ClassValue
  ui?: Partial<Record<keyof PopoverTV['slots'], ClassValue>>
}

export interface PopoverEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
  /** Fired when `dismissible: false` blocked an outside-tap dismiss. */
  (e: 'close:prevent'): void
}

export interface PopoverSlots {
  /** Trigger element — wrapped in `SheetTrigger` (sheet) or `PopoverTrigger`
   *  (anchor). Both toggle open on tap. */
  default(props: { open: boolean }): any
  /** Custom anchor element — anchor mode only. */
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
  modal: false,
  dismissible: true,
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

// --- Anchor-mode trigger measurement ----------------------------------------
// Sheet mode skips this entirely (it docks to the viewport, not the trigger).
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
  <!-- SHEET MODE (default) — `SheetRoot` owns state + drag: tap trigger, sheet
       slides from a viewport edge, drag back toward that edge to dismiss. -->
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

  <!-- ANCHOR MODE — measures the trigger and docks the content next to it. -->
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
