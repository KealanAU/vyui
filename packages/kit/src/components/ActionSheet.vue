<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme, { leadingIconFg, TRAILING_ICON_FG } from '../theme/actionSheet'
import { resolveColors } from '../theme/colors'
import type { SheetDirection } from '@vyui/core'
import type { AppConfig } from '../types'
import type { AvatarProps } from './Avatar.vue'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.actionSheet`.
 */
export const buildActionSheet = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).actionSheet as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type ActionSheetVariants = VariantProps<ReturnType<typeof buildActionSheet>>

export interface ActionSheetItem {
  /** Row label. */
  label?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  /** Render a `<VyAvatar>` in the leading slot instead of an icon. */
  avatar?: AvatarProps
  /** Iconify name rendered in the trailing slot. */
  trailingIcon?: string
  /**
   * Semantic color for this row. Defaults to neutral when omitted. Use
   * `error` for destructive actions, `primary` to highlight a default.
   */
  color?: ActionSheetVariants['color']
  /** Disable the row — non-interactive, dimmed. */
  disabled?: boolean
  /** Optional value forwarded to the `select` emit. */
  value?: any
  /** Fired before the sheet auto-closes (when `closeOnSelect` is true). */
  onSelect?: (item: ActionSheetItem) => void
  [key: string]: any
}

export interface ActionSheetProps {
  /** Controlled open state — bind with `v-model:open`. */
  open?: boolean
  /** Convenience alias for `open` — bind with `v-model`. */
  modelValue?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /**
   * Items to render. Flat array, OR nested array where each inner array
   * becomes a section separated by a thin divider (Linear-style grouping).
   */
  items?: ActionSheetItem[] | ActionSheetItem[][]
  /** Optional uppercase section heading rendered above the list. */
  title?: string
  /** Optional supporting copy rendered below the title. */
  description?: string
  /** Render the dim overlay behind the sheet. @defaultValue `true` */
  overlay?: boolean
  /** Tapping the overlay or dragging down closes the sheet. @defaultValue `true` */
  dismissible?: boolean
  /** Auto-close after an item is selected. @defaultValue `true` */
  closeOnSelect?: boolean
  /** Show the drag handle at the top of the sheet. @defaultValue `true` */
  handle?: boolean
  /**
   * Edge the action sheet slides and drags from.
   * @defaultValue `'bottom'`
   */
  side?: SheetDirection
  /**
   * Optional cancel button rendered below the list (iOS pattern). Pass a
   * string to override the label. Linear-style sheets typically omit this.
   * @defaultValue `false`
   */
  cancel?: boolean | string
  size?: ActionSheetVariants['size']
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildActionSheet>['slots'], any>>
}

export interface ActionSheetEmits {
  (e: 'update:open', value: boolean): void
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', item: ActionSheetItem): void
  (e: 'cancel'): void
}

export interface ActionSheetSlots {
  /**
   * Trigger content. `SheetTrigger` opens the sheet on tap; do NOT bind a
   * `@tap` handler on the slotted child that also sets the open state — use
   * `v-model:open` (or `v-model`) instead.
   */
  default(props: { open: boolean }): any
  /** Header region — replaces the built-in title / description block. */
  header(props?: {}): any
  /** Custom rendering for an item's leading slot. Receives `iconColor` so custom icons can match the item's resolved foreground. */
  'item-leading'(props: { item: ActionSheetItem, index: number, iconColor: string }): any
  /** Custom rendering for an item's label. */
  'item-label'(props: { item: ActionSheetItem, index: number }): any
  /** Custom rendering for an item's trailing slot. Receives `iconColor` so custom icons can match the trailing foreground. */
  'item-trailing'(props: { item: ActionSheetItem, index: number, iconColor: string }): any
}

/**
 * Flat row shape rendered into the list. Sections are flattened to a single
 * sequence with `separator` rows between groups — one child per `v-for`
 * iteration keeps Vue-Lynx's patcher happy (no conditional sibling
 * fragments).
 */
interface ActionRow {
  key: string
  kind: 'separator' | 'item'
  item?: ActionSheetItem
  index: number
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  SheetRoot,
  SheetTrigger,
  SheetBackdrop,
  SheetContent,
  SheetHandle,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'
import { resolveColorHex } from '../utils/resolveColor'
import VyAvatar from './Avatar.vue'

const props = withDefaults(defineProps<ActionSheetProps>(), {
  defaultOpen: false,
  overlay: true,
  dismissible: true,
  closeOnSelect: true,
  handle: true,
  cancel: false,
})
const emit = defineEmits<ActionSheetEmits>()
defineSlots<ActionSheetSlots>()

const appConfig = useAppConfig()

const resolvedOpen = computed(() => (props.open !== undefined ? props.open : props.modelValue))

function onOpenChange(value: boolean) {
  emit('update:open', value)
  emit('update:modelValue', value)
}

const ui = computed(() => buildActionSheet(appConfig)({
  size: props.size,
}))

const rows = computed<ActionRow[]>(() => {
  if (!props.items?.length) return []
  const groups: ActionSheetItem[][] = Array.isArray(props.items[0])
    ? (props.items as ActionSheetItem[][])
    : [props.items as ActionSheetItem[]]

  const out: ActionRow[] = []
  let runningIndex = 0
  groups.forEach((group, gi) => {
    if (gi > 0) out.push({ key: `sep-${gi}`, kind: 'separator', index: -1 })
    group.forEach((item, i) => {
      out.push({ key: `g${gi}-it-${i}`, kind: 'item', item, index: runningIndex++ })
    })
  })
  return out
})

function handleSelect(item: ActionSheetItem) {
  if (item.disabled) return
  item.onSelect?.(item)
  emit('select', item)
  if (props.closeOnSelect) onOpenChange(false)
}

function handleCancel() {
  emit('cancel')
  onOpenChange(false)
}

const cancelLabel = computed(() => (typeof props.cancel === 'string' ? props.cancel : 'Cancel'))

const itemUi = (color?: ActionSheetItem['color'], disabled?: boolean) =>
  buildActionSheet(appConfig)({ size: props.size, color, disabled: disabled || undefined })

// Lynx SVG can't inherit currentColor — bake the row's foreground into the
// icon fill at render time (same pattern as Button/Input).
const itemIconColor = (color?: ActionSheetItem['color']) => {
  const fg = leadingIconFg(color)
  return resolveColorHex(appConfig, fg.semantic, fg.shade)
}
const trailingIconColor = computed(() => resolveColorHex(appConfig, TRAILING_ICON_FG.semantic, TRAILING_ICON_FG.shade))
</script>

<template>
  <SheetRoot
    :open="resolvedOpen"
    :default-open="defaultOpen"
    :side="side"
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

    <SheetContent :class="ui.content({ class: [props.class, props.ui?.content] })">
      <SheetHandle v-if="handle" :class="ui.handle({ class: props.ui?.handle })" />

      <view
        v-if="title || description || !!$slots.header"
        :class="ui.header({ class: props.ui?.header })"
      >
        <slot name="header">
          <text v-if="title" :class="ui.title({ class: props.ui?.title })">{{ title }}</text>
          <text v-if="description" :class="ui.description({ class: props.ui?.description })">{{ description }}</text>
        </slot>
      </view>

      <view :class="ui.list({ class: props.ui?.list })">
        <template v-for="row in rows" :key="row.key">
          <view
            v-if="row.kind === 'separator'"
            :class="ui.separator({ class: props.ui?.separator })"
          />
          <view
            v-else
            :class="itemUi(row.item?.color, row.item?.disabled).item({ class: props.ui?.item })"
            @tap="row.item && handleSelect(row.item)"
          >
            <slot name="item-leading" :item="row.item!" :index="row.index" :icon-color="itemIconColor(row.item?.color)">
              <VyAvatar
                v-if="row.item?.avatar"
                v-bind="row.item.avatar"
                :class="ui.itemLeadingAvatar({ class: props.ui?.itemLeadingAvatar })"
              />
              <VyIcon
                v-else-if="row.item?.icon"
                :name="row.item.icon"
                :color="itemIconColor(row.item?.color)"
                :class="itemUi(row.item?.color).itemLeadingIcon({ class: props.ui?.itemLeadingIcon })"
              />
            </slot>
            <slot name="item-label" :item="row.item!" :index="row.index">
              <text :class="itemUi(row.item?.color).itemLabel({ class: props.ui?.itemLabel })">
                {{ row.item?.label }}
              </text>
            </slot>
            <slot name="item-trailing" :item="row.item!" :index="row.index" :icon-color="trailingIconColor">
              <VyIcon
                v-if="row.item?.trailingIcon"
                :name="row.item.trailingIcon"
                :color="trailingIconColor"
                :class="ui.itemTrailingIcon({ class: props.ui?.itemTrailingIcon })"
              />
            </slot>
          </view>
        </template>
      </view>

      <view
        v-if="cancel"
        :class="ui.cancel({ class: props.ui?.cancel })"
        @tap="handleCancel"
      >
        <text :class="ui.cancelLabel({ class: props.ui?.cancelLabel })">{{ cancelLabel }}</text>
      </view>
    </SheetContent>
  </SheetRoot>
</template>
