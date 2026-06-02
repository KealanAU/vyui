<script lang="ts">
import { tv, type VariantProps } from 'tailwind-variants'
import theme from '../theme/tabs'
import { resolveColors } from '../theme/colors'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.tabs`.
 */
export const buildTabs = (appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).tabs as Partial<ReturnType<typeof theme>> | undefined
  return tv({ extend: tv(theme(resolveColors(appConfig))), ...(overrides || {}) })
}

type TabsVariants = VariantProps<ReturnType<typeof buildTabs>>

export interface TabsItem {
  label?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  /** Named slot used to render this tab's content. Falls back to `'content'`. */
  slot?: string
  /** Static string content rendered when no slot is provided. */
  content?: string
  /** Unique identifier for the tab. Defaults to the index when omitted. */
  value?: string | number
  disabled?: boolean
  [key: string]: any
}

export interface TabsProps {
  items?: TabsItem[]
  color?: TabsVariants['color']
  variant?: TabsVariants['variant']
  size?: TabsVariants['size']
  orientation?: 'horizontal' | 'vertical'
  /**
   * Layout inside each trigger. `inline` puts the icon next to the label;
   * `stacked` puts the icon above. Stacked is the right call when many
   * triggers crowd a narrow list (e.g. 6 pills on a 360-wide phone).
   */
  direction?: TabsVariants['direction']
  /** Controlled active tab value. */
  modelValue?: string | number
  /** Active tab value at mount time when uncontrolled. */
  defaultValue?: string | number
  /** When `false`, the content region is not rendered. */
  content?: boolean
  /** Whether inactive tab content should unmount. */
  unmountOnHide?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildTabs>['slots'], any>>
}

export interface TabsEmits {
  (e: 'update:modelValue', value: string | number): void
}

export interface TabsSlots {
  leading(props: { item: TabsItem, index: number }): any
  default(props: { item: TabsItem, index: number }): any
  trailing(props: { item: TabsItem, index: number }): any
  content(props: { item: TabsItem, index: number }): any
  [key: string]: (props: { item: TabsItem, index: number }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<TabsProps>(), {
  content: true,
  defaultValue: '0',
  orientation: 'horizontal',
  unmountOnHide: true,
})
const emit = defineEmits<TabsEmits>()
const slots = defineSlots<TabsSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildTabs(appConfig)({
  color: props.color,
  variant: props.variant,
  size: props.size,
  orientation: props.orientation,
  direction: props.direction,
}))

const resolveValue = (item: TabsItem, index: number) =>
  item.value !== undefined ? item.value : String(index)
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :unmount-on-hide="unmountOnHide"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TabsList :class="ui.list({ class: props.ui?.list })">
      <TabsIndicator :class="ui.indicator({ class: props.ui?.indicator })" />

      <TabsTrigger
        v-for="(item, index) in items"
        :key="index"
        :value="resolveValue(item, index)"
        :disabled="item.disabled"
        :class="ui.trigger({ class: props.ui?.trigger })"
      >
        <slot name="leading" :item="item" :index="index">
          <VyIcon
            v-if="item.icon"
            :name="item.icon"
            :class="ui.leadingIcon({ class: props.ui?.leadingIcon })"
          />
        </slot>

        <text
          v-if="item.label || !!slots.default"
          :class="ui.label({ class: props.ui?.label })"
        >
          <slot :item="item" :index="index">{{ item.label }}</slot>
        </text>

        <slot name="trailing" :item="item" :index="index" />
      </TabsTrigger>
    </TabsList>

    <template v-if="content">
      <TabsContent
        v-for="(item, index) in items"
        :key="index"
        :value="resolveValue(item, index)"
        :class="ui.content({ class: props.ui?.content })"
      >
        <slot :name="(item.slot || 'content')" :item="item" :index="index">
          <text v-if="item.content">{{ item.content }}</text>
        </slot>
      </TabsContent>
    </template>
  </TabsRoot>
</template>
