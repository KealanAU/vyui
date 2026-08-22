<script lang="ts">
/**
 * Internal — renders the items list for `VyDropdownMenu`, with per-item slots
 * forwarded from the parent via `useSlots()` and indexed by the item's `slot`
 * field. Not exported from the package.
 */
import type { ClassValue } from '../../composables/useStyledComponent'
import type {
  DropdownMenuItem,
  DropdownMenuItemSlotProps,
  DropdownMenuTV,
} from '../DropdownMenu.vue'

export interface MenuRow {
  key: string
  kind: 'separator' | 'label' | 'item'
  item?: DropdownMenuItem
  index: number
}

export interface DropdownMenuItemsProps {
  rows: MenuRow[]
  ui: ReturnType<DropdownMenuTV>
  uiOverrides?: Partial<Record<keyof DropdownMenuTV['slots'], ClassValue>>
  labelKey?: string
  descriptionKey?: string
  checkedIcon: string
  loadingIcon: string
}
</script>

<script setup lang="ts">
import { useSlots } from 'vue'
import {
  DropdownMenuItem as CoreDropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Icon as VyIcon,
} from '@vyui/core'
import { iconFg } from '../../theme/dropdownMenu'
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

// Baked icon fill (see theme/iconColor.ts), from the item's resting foreground.
// The `group-ui-highlighted:` shade shift stays class-only, so the icon keeps
// its resting color while pressed.
const itemIconColor = (color?: DropdownMenuItem['color']) => {
  const fg = iconFg(color)
  return resolveColorHex(appConfig, fg.semantic, fg.shade)
}

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
      <!-- `enableCSSInheritance: false` — color lands on this <text>. -->
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

        <view v-if="getItemSlot(row.item, 'trailing') || slots['item-trailing']" :class="ui.itemTrailing({ class: uiOverrides?.itemTrailing })">
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
        </view>
      </template>
    </CoreDropdownMenuItem>
  </template>
</template>
