<script lang="ts">
import theme, { iconFg } from '../theme/tabs'
import type { ThemeTV, VariantProps } from '../composables/useStyledComponent'

type TabsTV = ThemeTV<typeof theme>
type TabsVariants = VariantProps<TabsTV>

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
  /**
   * Per-tab override of the root `unmountOnHide`. Set `true` under a
   * keep-alive root for a panel whose subtree writes styles from main-thread
   * worklets (`setStyleProperty` / `animate(fill: 'forwards')`) — those nodes
   * can keep painting through the kept-alive `display: none` on device.
   */
  unmountOnHide?: boolean
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
  /**
   * Whether inactive tab content should unmount. When `false`, a panel mounts
   * on its first visit and stays mounted (hidden) after — revisits become a
   * style flip instead of a full remount.
   */
  unmountOnHide?: boolean
  /**
   * Land the trigger/indicator update one flush before the content swap so
   * the tab bar responds instantly even when the incoming panel is heavy.
   */
  deferContent?: boolean
  class?: any
  ui?: Partial<Record<keyof TabsTV['slots'], any>>
}

export interface TabsEmits {
  (e: 'update:modelValue', value: string | number): void
}

export interface TabsSlots {
  /** Always receives `iconColor` (optional only to satisfy the dynamic-slot
   * index signature) so custom icons can match the trigger's resolved
   * active/inactive foreground. */
  leading(props: { item: TabsItem, index: number, iconColor?: string }): any
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
import { useStyledComponent } from '../composables/useStyledComponent'
import { resolveColorHex } from '../utils/resolveColor'
import { useColorMode } from '../composables/useColorMode'

const props = withDefaults(defineProps<TabsProps>(), {
  content: true,
  defaultValue: '0',
  orientation: 'horizontal',
  unmountOnHide: true,
  deferContent: false,
})
const emit = defineEmits<TabsEmits>()
const slots = defineSlots<TabsSlots>()

const appConfig = useAppConfig()

const { ui } = useStyledComponent('tabs', theme, () => ({
  color: props.color,
  variant: props.variant,
  size: props.size,
  orientation: props.orientation,
  direction: props.direction,
}))

// Slot classes are identical for every trigger/panel, so resolve each ONCE per
// variant change instead of per element per render — a tab switch re-renders
// this whole template (the scoped-slot `activeValue` changes), and on Lynx's
// interpreter the tailwind-variants slot calls are the expensive part.
const classes = computed(() => ({
  root: ui.value.root({ class: [props.class, props.ui?.root] }),
  list: ui.value.list({ class: props.ui?.list }),
  indicator: ui.value.indicator({ class: props.ui?.indicator }),
  trigger: ui.value.trigger({ class: props.ui?.trigger }),
  leadingIcon: ui.value.leadingIcon({ class: props.ui?.leadingIcon }),
  label: ui.value.label({ class: props.ui?.label }),
  content: ui.value.content({ class: props.ui?.content }),
}))

const resolveValue = (item: TabsItem, index: number) =>
  item.value !== undefined ? item.value : String(index)

// Lynx SVG can't inherit currentColor, and the active/inactive `group-ui-*`
// classes on `leadingIcon` never reach the rasterized glyph — bake the fill
// per trigger instead (same pattern as Button/Input). `activeValue` comes
// from TabsRoot's scoped slot: the same ref `TabsTrigger` compares against
// (strict equality), so it also tracks uncontrolled tabs. `isDark` is threaded
// so the baked neutral fill (inactive `text-muted`) tracks the mode. Fallbacks
// mirror the theme's `defaultVariants` (`primary` / `pill`).
const { isDark } = useColorMode()
const triggerIconColor = (item: TabsItem, index: number, activeValue: string | number | undefined) => {
  const fg = iconFg(props.color ?? 'primary', props.variant ?? 'pill', resolveValue(item, index) === activeValue, isDark.value)
  return fg === 'white' ? 'white' : resolveColorHex(appConfig, fg.semantic, fg.shade)
}
</script>

<template>
  <TabsRoot
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :unmount-on-hide="unmountOnHide"
    :defer-content="deferContent"
    :class="classes.root"
    v-slot="{ modelValue: activeValue }"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <TabsList :class="classes.list">
      <TabsIndicator :class="classes.indicator" />

      <TabsTrigger
        v-for="(item, index) in items"
        :key="index"
        :value="resolveValue(item, index)"
        :disabled="item.disabled"
        :class="classes.trigger"
      >
        <slot name="leading" :item="item" :index="index" :icon-color="triggerIconColor(item, index, activeValue)">
          <VyIcon
            v-if="item.icon"
            :name="item.icon"
            :color="triggerIconColor(item, index, activeValue)"
            :class="classes.leadingIcon"
          />
        </slot>

        <text
          v-if="item.label || !!slots.default"
          :class="classes.label"
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
        :unmount-on-hide="item.unmountOnHide"
        :class="classes.content"
      >
        <slot :name="(item.slot || 'content')" :item="item" :index="index">
          <text v-if="item.content">{{ item.content }}</text>
        </slot>
      </TabsContent>
    </template>
  </TabsRoot>
</template>
