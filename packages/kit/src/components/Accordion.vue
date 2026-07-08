<script lang="ts">
import { tv } from 'tailwind-variants'
import { defineThemeBuilder } from '../utils/tv'
import theme from '../theme/accordion'
import type { AppConfig } from '../types'

/**
 * Resolve a per-app `tv` factory by merging the package default theme with
 * user overrides pulled from `appConfig.ui.accordion`.
 */
export const buildAccordion = defineThemeBuilder((appConfig: AppConfig) => {
  const overrides = (appConfig.ui as Record<string, unknown>).accordion as Partial<typeof theme> | undefined
  return tv({ extend: tv(theme), ...(overrides || {}) })
})

export interface AccordionItem {
  label?: string
  /** Iconify name rendered in the leading slot. */
  icon?: string
  /** Iconify name for the trailing toggle. Defaults to `appConfig.ui.icons.chevronDown`. */
  trailingIcon?: string
  /** Named slot used to render this item's content. Falls back to `'content'`. */
  slot?: string
  /** Static string content rendered when no slot is provided. */
  content?: string
  /** Unique value for the item. Defaults to the index when omitted. */
  value?: string
  disabled?: boolean
  [key: string]: any
}

export interface AccordionProps {
  items?: AccordionItem[]
  /** `'single'` allows one open item; `'multiple'` allows many. */
  type?: 'single' | 'multiple'
  /** `single`-only: lets the user close the currently open item. */
  collapsible?: boolean
  disabled?: boolean
  /** Controlled open value(s). */
  modelValue?: string | string[]
  /** Open value(s) at mount time when uncontrolled. */
  defaultValue?: string | string[]
  /** Default trailing icon. Defaults to `appConfig.ui.icons.chevronDown`. */
  trailingIcon?: string
  /** Whether closed item content should unmount. */
  unmountOnHide?: boolean
  class?: any
  ui?: Partial<Record<keyof ReturnType<typeof buildAccordion>['slots'], any>>
}

export interface AccordionEmits {
  (e: 'update:modelValue', value: string | string[] | undefined): void
}

export interface AccordionSlots {
  leading(props: { item: AccordionItem, index: number, open: boolean }): any
  default(props: { item: AccordionItem, index: number, open: boolean }): any
  trailing(props: { item: AccordionItem, index: number, open: boolean }): any
  content(props: { item: AccordionItem, index: number, open: boolean }): any
  body(props: { item: AccordionItem, index: number, open: boolean }): any
  [key: string]: (props: { item: AccordionItem, index: number, open: boolean }) => any
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger,
  Icon as VyIcon,
} from '@vyui/core'
import { useAppConfig } from '../composables/useAppConfig'

const props = withDefaults(defineProps<AccordionProps>(), {
  type: 'single',
  collapsible: true,
  unmountOnHide: true,
})
const emit = defineEmits<AccordionEmits>()
const slots = defineSlots<AccordionSlots>()

const appConfig = useAppConfig()

const ui = computed(() => buildAccordion(appConfig)({
  disabled: props.disabled,
}))

const defaultTrailingIcon = computed(
  () => props.trailingIcon || appConfig.ui.icons?.chevronDown || 'i-lucide-chevron-down',
)

const resolveValue = (item: AccordionItem, index: number) =>
  item.value !== undefined ? item.value : String(index)
</script>

<template>
  <AccordionRoot
    :type="(type as any)"
    :collapsible="collapsible"
    :disabled="disabled"
    :model-value="(modelValue as any)"
    :default-value="(defaultValue as any)"
    :unmount-on-hide="unmountOnHide"
    :class="ui.root({ class: [props.class, props.ui?.root] })"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AccordionItem
      v-for="(item, index) in items"
      v-slot="{ open }"
      :key="index"
      :value="resolveValue(item, index)"
      :disabled="item.disabled"
      :class="ui.item({ class: props.ui?.item })"
    >
      <AccordionHeader :class="ui.header({ class: props.ui?.header })">
        <AccordionTrigger
          :class="ui.trigger({ class: props.ui?.trigger, disabled: item.disabled })"
        >
          <slot name="leading" :item="item" :index="index" :open="open">
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
            <slot :item="item" :index="index" :open="open">{{ item.label }}</slot>
          </text>

          <slot name="trailing" :item="item" :index="index" :open="open">
            <VyIcon
              :name="item.trailingIcon || defaultTrailingIcon"
              :class="ui.trailingIcon({ class: props.ui?.trailingIcon })"
            />
          </slot>
        </AccordionTrigger>
      </AccordionHeader>

      <AccordionContent
        v-if="item.content || !!slots.content || (item.slot && !!slots[item.slot]) || !!slots.body"
        :class="ui.content({ class: props.ui?.content })"
      >
        <slot :name="(item.slot || 'content')" :item="item" :index="index" :open="open">
          <view :class="ui.body({ class: props.ui?.body })">
            <slot name="body" :item="item" :index="index" :open="open">
              <text v-if="item.content" :class="ui.bodyText({ class: props.ui?.bodyText })">{{ item.content }}</text>
            </slot>
          </view>
        </slot>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
