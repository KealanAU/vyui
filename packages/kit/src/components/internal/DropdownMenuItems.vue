<script lang="ts">
/**
 * Internal — renders the items list for `VyDropdownMenu`. Per-item slots are
 * forwarded from the parent via `useSlots()` and indexed by the item's `slot`
 * field.
 *
 * Not exported from the package — its only consumer is `DropdownMenu.vue`.
 */
import type {
  DropdownMenuItem,
  DropdownMenuItemSlotProps,
  buildDropdownMenu,
} from '../DropdownMenu.vue'

export interface MenuRow {
  key: string
  kind: 'separator' | 'label' | 'item'
  item?: DropdownMenuItem
  index: number
}

export interface DropdownMenuItemsProps {
  rows: MenuRow[]
  ui: ReturnType<ReturnType<typeof buildDropdownMenu>>
  uiOverrides?: Partial<Record<keyof ReturnType<typeof buildDropdownMenu>['slots'], any>>
  labelKey?: string
  descriptionKey?: string
  childrenIcon: string
  checkedIcon: string
  loadingIcon: string
}
</script>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import {
  DropdownMenuItem as CoreDropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Icon as VyIcon,
} from '@vyui/core'
import { iconFg, TRAILING_ICON_FG } from '../../theme/dropdownMenu'
import { useAppConfig } from '../../composables/useAppConfig'
import { resolveColorHex } from '../../utils/resolveColor'
import VyAvatar from '../Avatar.vue'

const props = withDefaults(defineProps<DropdownMenuItemsProps>(), {
  labelKey: 'label',
  descriptionKey: 'description',
})

defineSlots<{
  item(p: DropdownMenuItemSlotProps): any
  'item-leading'(p: DropdownMenuItemSlotProps): any
  'item-label'(p: DropdownMenuItemSlotProps): any
  'item-description'(p: DropdownMenuItemSlotProps): any
  'item-trailing'(p: DropdownMenuItemSlotProps): any
  [key: string]: any
}>()

const slots = useSlots()

const appConfig = useAppConfig()

// Lynx SVG can't inherit currentColor — bake the item's resting foreground
// into the icon fill at render time (same pattern as Button/Input). The
// `group-ui-highlighted:` shade shift stays class-only (it can't reach the
// rasterized glyph), so the icon keeps its resting color while pressed.
const itemIconColor = (color?: DropdownMenuItem['color']) => {
  const fg = iconFg(color)
  return resolveColorHex(appConfig, fg.semantic, fg.shade)
}
const trailingIconColor = computed(() => resolveColorHex(appConfig, TRAILING_ICON_FG.semantic, TRAILING_ICON_FG.shade))

function getLabel(item: DropdownMenuItem | undefined): string | undefined {
  if (!item) return undefined
  const v = (item as Record<string, any>)[props.labelKey]
  return typeof v === 'string' ? v : undefined
}

function getDescription(item: DropdownMenuItem | undefined): string | undefined {
  if (!item) return undefined
  const v = (item as Record<string, any>)[props.descriptionKey]
  return typeof v === 'string' ? v : undefined
}

function getItemSlot(item: DropdownMenuItem | undefined, suffix?: 'leading' | 'label' | 'description' | 'trailing') {
  if (!item?.slot) return undefined
  const key = suffix ? `${item.slot}-${suffix}` : item.slot
  return (slots as Record<string, any>)[key]
}
</script>

<template>
  <template v-for="row in rows" :key="row.key">
    <DropdownMenuSeparator
      v-if="row.kind === 'separator'"
      :class="ui.separator({ class: uiOverrides?.separator })"
    />
    <DropdownMenuLabel
      v-else-if="row.kind === 'label'"
      :class="ui.label({ class: uiOverrides?.label })"
    >
      <!-- `enableCSSInheritance: false`: the `label` slot's `text-highlighted`
           sits on the wrapping <view>, so the heading color must land on this
           <text> directly. -->
      <text :class="ui.itemLabel({ class: ['text-highlighted', uiOverrides?.itemLabel] })">{{ getLabel(row.item) }}</text>
    </DropdownMenuLabel>

    <DropdownMenuCheckboxItem
      v-else-if="row.item?.type === 'checkbox'"
      :checked="!!row.item.checked"
      :disabled="row.item.disabled"
      :class="ui.item({ color: row.item?.color, class: [row.item?.class, uiOverrides?.item] })"
      @select="row.item?.onSelect?.($event as unknown as Event)"
      @update:checked="row.item?.onUpdateChecked?.($event === true)"
    >
      <template v-if="getItemSlot(row.item)">
        <component :is="getItemSlot(row.item)" :item="row.item" :active="false" :index="row.index" :ui="ui" />
      </template>
      <template v-else>
        <VyIcon
          v-if="row.item.checked"
          :name="checkedIcon"
          :color="itemIconColor(row.item?.color)"
          :class="ui.itemLeadingIcon({ color: row.item?.color, class: uiOverrides?.itemLeadingIcon })"
        />
        <view :class="ui.itemWrapper({ class: uiOverrides?.itemWrapper })">
          <text :class="ui.itemLabel({ color: row.item?.color, class: uiOverrides?.itemLabel })">{{ getLabel(row.item) }}</text>
          <text v-if="getDescription(row.item)" :class="ui.itemDescription({ class: uiOverrides?.itemDescription })">{{ getDescription(row.item) }}</text>
        </view>
      </template>
    </DropdownMenuCheckboxItem>

    <CoreDropdownMenuItem
      v-else
      :disabled="row.item?.disabled"
      :class="ui.item({ color: row.item?.color, class: [row.item?.class, uiOverrides?.item] })"
      @select="row.item?.onSelect?.($event as unknown as Event)"
    >
      <template v-if="getItemSlot(row.item)">
        <component :is="getItemSlot(row.item)" :item="row.item!" :active="false" :index="row.index" :ui="ui" />
      </template>
      <slot
        v-else-if="slots.item"
        name="item"
        :item="row.item!"
        :active="false"
        :index="row.index"
        :ui="ui"
      />
      <template v-else>
        <component
          v-if="getItemSlot(row.item, 'leading')"
          :is="getItemSlot(row.item, 'leading')"
          :item="row.item!"
          :active="false"
          :index="row.index"
          :ui="ui"
        />
        <slot
          v-else-if="slots['item-leading']"
          name="item-leading"
          :item="row.item!"
          :active="false"
          :index="row.index"
          :ui="ui"
        />
        <VyAvatar
          v-else-if="row.item?.avatar"
          v-bind="row.item.avatar"
          :class="ui.itemLeadingAvatar({ class: uiOverrides?.itemLeadingAvatar })"
        />
        <VyIcon
          v-else-if="row.item?.loading"
          :name="loadingIcon"
          :color="itemIconColor(row.item?.color)"
          :class="ui.itemLeadingIcon({ color: row.item?.color, class: [uiOverrides?.itemLeadingIcon, 'animate-spin'] })"
        />
        <VyIcon
          v-else-if="row.item?.icon"
          :name="row.item.icon"
          :color="itemIconColor(row.item?.color)"
          :class="ui.itemLeadingIcon({ color: row.item?.color, class: uiOverrides?.itemLeadingIcon })"
        />

        <view :class="ui.itemWrapper({ class: uiOverrides?.itemWrapper })">
          <component
            v-if="getItemSlot(row.item, 'label')"
            :is="getItemSlot(row.item, 'label')"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <slot
            v-else-if="slots['item-label']"
            name="item-label"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <text v-else :class="ui.itemLabel({ color: row.item?.color, class: uiOverrides?.itemLabel })">{{ getLabel(row.item) }}</text>

          <component
            v-if="getItemSlot(row.item, 'description')"
            :is="getItemSlot(row.item, 'description')"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <slot
            v-else-if="slots['item-description']"
            name="item-description"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <text v-else-if="getDescription(row.item)" :class="ui.itemDescription({ class: uiOverrides?.itemDescription })">{{ getDescription(row.item) }}</text>
        </view>

        <view v-if="row.item?.children?.length || getItemSlot(row.item, 'trailing') || slots['item-trailing']" :class="ui.itemTrailing({ class: uiOverrides?.itemTrailing })">
          <component
            v-if="getItemSlot(row.item, 'trailing')"
            :is="getItemSlot(row.item, 'trailing')"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <slot
            v-else-if="slots['item-trailing']"
            name="item-trailing"
            :item="row.item!"
            :active="false"
            :index="row.index"
            :ui="ui"
          />
          <VyIcon
            v-else-if="row.item?.children?.length"
            :name="childrenIcon"
            :color="trailingIconColor"
            :class="ui.itemTrailingIcon({ class: uiOverrides?.itemTrailingIcon })"
          />
        </view>
      </template>
    </CoreDropdownMenuItem>
  </template>
</template>
