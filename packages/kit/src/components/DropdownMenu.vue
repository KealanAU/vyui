<script lang="ts">
import theme from '../theme/dropdownMenu'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'
import type { AvatarProps } from './Avatar.vue'

export type DropdownMenuTV = ThemeTV<typeof theme>
type DropdownMenuVariants = VariantProps<DropdownMenuTV>

export interface DropdownMenuItem {
  /** Text label rendered in the item. */
  label?: string
  /** Sub-line rendered under the label. */
  description?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  /** Render a `<VyAvatar>` in the leading slot instead of an icon. */
  avatar?: AvatarProps
  /** Semantic color for this item. */
  color?: DropdownMenuVariants['color']
  /**
   * Item type. `separator` renders a `<DropdownMenuSeparator>`; `label`
   * renders a non-interactive `<DropdownMenuLabel>`. Defaults to `link`.
   */
  type?: 'label' | 'separator' | 'link' | 'checkbox'
  /** Disable the item. */
  disabled?: boolean
  /** Spin the leading icon (or built-in loading icon if no leading). */
  loading?: boolean
  /** For `checkbox` items — controlled checked state. */
  checked?: boolean
  /** Custom slot key. When set, the item is rendered via `#{slot}-*` slots. */
  slot?: string
  /** Per-item class merged onto the item base. */
  class?: any
  /** Nested submenu items. Currently rendered as a flat group — sub-menu primitive integration is TODO. */
  children?: DropdownMenuItem[] | DropdownMenuItem[][]
  /** Fired when the item is selected. */
  onSelect?: (e: Event) => void
  /** For `checkbox` items — fired with the new checked state. */
  onUpdateChecked?: (checked: boolean) => void
  [key: string]: any
}

/**
 * Positioning settings — mirrors Nuxt UI's `content` prop bag so call sites
 * read cleanly: `<UDropdownMenu :content="{ side: 'bottom', align: 'start' }">`.
 * `sideOffset` is wired into the docking math; `side` / `align` choose the
 * dock edge; `alignOffset` shifts the menu along the cross-axis (horizontal
 * for top/bottom, vertical for left/right) — positive values move in the
 * positive axis direction (right / down) regardless of `align`.
 */
export interface DropdownMenuContentSettings {
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  alignOffset?: number
}

export interface DropdownMenuProps {
  /** Flat list, OR a nested array where each inner array becomes a group separated by a `<DropdownMenuSeparator>`. */
  items?: DropdownMenuItem[] | DropdownMenuItem[][]
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Disable the trigger. */
  disabled?: boolean
  /**
   * Modality. When `true`, taps outside the menu are blocked from reaching
   * the underlying app. @defaultValue `true`
   */
  modal?: boolean
  size?: DropdownMenuVariants['size']
  /**
   * Positioning settings — `side`, `align`, `sideOffset` control where the
   * menu docks relative to its trigger. (Sheet-presentation pickers belong
   * on `VySelect` / `VyCombobox` — DropdownMenu is the trigger-anchored
   * action menu.)
   * @defaultValue `{ side: 'bottom', sideOffset: 8, align: 'start' }`
   */
  content?: DropdownMenuContentSettings
  /** Key on each item used as the rendered label. @defaultValue `'label'` */
  labelKey?: string
  /** Key on each item used as the rendered description. @defaultValue `'description'` */
  descriptionKey?: string
  /** Iconify name for the trailing chevron on items with children. Defaults to `appConfig.ui.icons.chevronRight`. */
  childrenIcon?: string
  /** Iconify name for checked checkbox items. Defaults to `appConfig.ui.icons.check`. */
  checkedIcon?: string
  /** Iconify name for the loading spinner. Defaults to `appConfig.ui.icons.loading`. */
  loadingIcon?: string
  class?: any
  ui?: Partial<Record<keyof DropdownMenuTV['slots'], any>>
}

export interface DropdownMenuEmits {
  (e: 'update:open', value: boolean): void
}

/**
 * Slot prop bag handed to the item slots — matches Nuxt UI's
 * `{ item, active, index, ui }` payload so per-item slot signatures port
 * straight across.
 */
export interface DropdownMenuItemSlotProps {
  item: DropdownMenuItem
  active: boolean
  index: number
  ui: ReturnType<DropdownMenuTV>
}

export interface DropdownMenuSlots {
  /**
   * Trigger content. `DropdownMenuTrigger` toggles open state on tap; do NOT
   * bind a `@tap` handler on the slotted child that also sets the open state.
   */
  default(props: { open: boolean }): any
  /** Custom rendering for every item (replaces all per-section defaults). */
  item(props: DropdownMenuItemSlotProps): any
  /** Custom rendering for every item's leading slot. */
  'item-leading'(props: DropdownMenuItemSlotProps): any
  /** Custom rendering for every item's label. */
  'item-label'(props: DropdownMenuItemSlotProps): any
  /** Custom rendering for every item's description. */
  'item-description'(props: DropdownMenuItemSlotProps): any
  /** Custom rendering for every item's trailing slot. */
  'item-trailing'(props: DropdownMenuItemSlotProps): any
  /** Per-item slot — `<template #{item.slot}-trailing="{ item }">`. */
  [key: string]: any
}

/**
 * Flat row shape we render into the menu. Normalising groups/items into a
 * single linear list lets us emit one child per `v-for` iteration — no
 * conditional sibling fragments — which keeps Vue-Lynx's patcher happy.
 */
interface MenuRow {
  key: string
  kind: 'separator' | 'label' | 'item'
  item?: DropdownMenuItem
  index: number
}
</script>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  useElementRect,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { useStyledComponent } from '../composables/useStyledComponent'
import DropdownMenuItems from './internal/DropdownMenuItems.vue'

const props = withDefaults(defineProps<DropdownMenuProps>(), {
  defaultOpen: false,
  modal: true,
  labelKey: 'label',
  descriptionKey: 'description',
  content: () => ({ side: 'bottom', sideOffset: 8, align: 'start' }),
})
const emit = defineEmits<DropdownMenuEmits>()
defineSlots<DropdownMenuSlots>()

const appConfig = useAppConfig()

const resolvedChildrenIcon = computed(() => props.childrenIcon || appConfig.ui.icons?.chevronRight || 'i-lucide-chevron-right')
const resolvedCheckedIcon = computed(() => props.checkedIcon || appConfig.ui.icons?.check || 'i-lucide-check')
const resolvedLoadingIcon = computed(() => props.loadingIcon || appConfig.ui.icons?.loading || 'i-lucide-loader-circle')

const { ui } = useStyledComponent('dropdownMenu', theme, () => ({
  size: props.size,
}))

/**
 * Normalise `items` into a flat row list with group separators interleaved.
 * Each row renders as a single component so the menu content has no
 * conditional sibling fragments — every row in the loop produces exactly
 * one child node, which is what Lynx's patcher expects.
 */
const rows = computed<MenuRow[]>(() => {
  if (!props.items?.length) return []
  const groups: DropdownMenuItem[][] = Array.isArray(props.items[0])
    ? (props.items as DropdownMenuItem[][])
    : [props.items as DropdownMenuItem[]]

  const out: MenuRow[] = []
  let idx = 0
  groups.forEach((group, gi) => {
    if (gi > 0) out.push({ key: `gsep-${gi}`, kind: 'separator', index: idx++ })
    group.forEach((item, i) => {
      if (item.type === 'separator') out.push({ key: `g${gi}-sep-${i}`, kind: 'separator', index: idx++ })
      else if (item.type === 'label') out.push({ key: `g${gi}-lbl-${i}`, kind: 'label', item, index: idx++ })
      else out.push({ key: `g${gi}-it-${i}`, kind: 'item', item, index: idx++ })
    })
  })
  return out
})

const resolvedOpen = computed(() => props.open)

const onUpdateOpen = (value: boolean) => emit('update:open', value)

// --- Trigger-anchored positioning -----------------------------------------
// DropdownMenu is the trigger-anchored action menu — picker UX with a
// drag-to-dismiss bottom sheet belongs on `VySelect` / `VyCombobox`.
// We measure the trigger wrapper via `useElementRect` on open /
// `@layoutchange`, then pass a `backdropStyle` that pushes the centered
// overlay container's child to the dock edge via flex alignment + padding.
const triggerWrapRef = ref<any>(null)
const triggerRect = ref<{ top: number, left: number, bottom: number, right: number, width: number, height: number } | null>(null)

async function measureTrigger() {
  const el = triggerWrapRef.value
  if (!el) return
  const rect = await useElementRect(el)
  if (rect.width === 0 && rect.height === 0) return
  triggerRect.value = rect
}

watch(
  () => resolvedOpen.value,
  async (isOpen) => {
    if (!isOpen) return
    await nextTick()
    await measureTrigger()
  },
)

const backdropStyle = computed<Record<string, any> | undefined>(() => {
  const r = triggerRect.value
  if (!r) return resolvedOpen.value ? { opacity: '0' } : undefined

  const settings = props.content ?? {}
  const side = settings.side ?? 'bottom'
  const sideOffset = settings.sideOffset ?? 8
  const alignOffset = settings.alignOffset ?? 0
  const align = settings.align ?? 'start'

  const padding: Record<string, string> = {}
  let alignItems = 'flex-start'
  let justifyContent: string = 'flex-start'

  // `padding-{right,bottom}` are measured from the END of the wrapper, so
  // they need `viewport - r.{right,bottom}` not just `r.{right,bottom}`.
  // The wrapper fills the viewport (`OverlayBackdrop`), so `100%` resolves
  // to the viewport dimension and `calc()` lets us subtract the rect's
  // viewport-origin coords without piping screen size through props.
  if (side === 'bottom') { padding.paddingTop = `${r.bottom + sideOffset}px`; alignItems = 'flex-start' }
  if (side === 'top')    { padding.paddingBottom = `calc(100% - ${r.top - sideOffset}px)`; alignItems = 'flex-end' }
  if (side === 'right')  { padding.paddingLeft = `${r.right + sideOffset}px`; alignItems = 'center'; justifyContent = 'flex-start' }
  if (side === 'left')   { padding.paddingRight = `calc(100% - ${r.left - sideOffset}px)`; alignItems = 'center'; justifyContent = 'flex-end' }

  if (side === 'top' || side === 'bottom') {
    if (align === 'start')      { padding.paddingLeft = `${r.left + alignOffset}px`; justifyContent = 'flex-start' }
    else if (align === 'end')   { padding.paddingRight = `calc(100% - ${r.right + alignOffset}px)`; justifyContent = 'flex-end' }
    else                        { justifyContent = 'center' }
  }

  // No zIndex: OverlayBackdrop's default 1000 already clears the island's 50.
  return { display: 'flex', alignItems, justifyContent, ...padding }
})
</script>

<template>
  <DropdownMenuRoot
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="onUpdateOpen"
  >
    <view
      ref="triggerWrapRef"
      @layoutchange="measureTrigger"
    >
      <DropdownMenuTrigger :disabled="disabled" :class="props.class">
        <slot :open="resolvedOpen ?? false" />
      </DropdownMenuTrigger>
    </view>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :backdrop-style="backdropStyle"
        :class="ui.content({ class: props.ui?.content })"
      >
        <DropdownMenuItems
          :rows="rows"
          :ui="ui"
          :ui-overrides="props.ui"
          :label-key="labelKey"
          :description-key="descriptionKey"
          :children-icon="resolvedChildrenIcon"
          :checked-icon="resolvedCheckedIcon"
          :loading-icon="resolvedLoadingIcon"
        >
          <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
            <slot :name="name" v-bind="slotProps as any" />
          </template>
        </DropdownMenuItems>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
