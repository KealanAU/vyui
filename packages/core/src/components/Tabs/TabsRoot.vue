<script lang="ts">
import type { Ref } from 'vue'
import type { DataOrientation, Direction, StringOrNumber } from '@/shared/types'
import type { PrimitiveProps } from '@/components/Primitive'
import { useVModel } from '@vueuse/core'
import { createContext, useDirection, useForwardExpose, useId } from '@/shared'

export interface TabsRootContext {
  modelValue: Ref<StringOrNumber | undefined>
  changeModelValue: (value: StringOrNumber) => void
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  unmountOnHide: Ref<boolean>
  activationMode: 'automatic' | 'manual'
  baseId: string
  tabsList: Ref<any | undefined>
  contentIds: Ref<Set<StringOrNumber>>
  registerContent: (value: StringOrNumber) => void
  unregisterContent: (value: StringOrNumber) => void
  /** Registry of trigger Lynx elements keyed by tab value. Populated by
   * `TabsTrigger` on mount so `TabsIndicator` can measure the active tab
   * without a DOM-style `querySelectorAll`. */
  triggers: Ref<Map<StringOrNumber, any>>
  registerTrigger: (value: StringOrNumber, el: any) => void
  unregisterTrigger: (value: StringOrNumber) => void
  /** Bumped by `TabsTrigger` on `@layoutchange` so the indicator re-measures. */
  layoutTick: Ref<number>
  notifyLayoutChange: () => void
}

export interface TabsRootProps<T extends StringOrNumber = StringOrNumber> extends PrimitiveProps {
  /**
   * The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs
   */
  defaultValue?: T
  /**
   * The orientation the tabs are laid out.
   * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the combobox when applicable. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /**
   * Whether a tab is activated automatically (on focus) or manually (on click).
   * @defaultValue automatic
   */
  activationMode?: 'automatic' | 'manual'
  /** The controlled value of the tab to activate. Can be bind as `v-model`. */
  modelValue?: T
  /**
   * When `true`, the element will be unmounted on closed state.
   *
   * @defaultValue `true`
   */
  unmountOnHide?: boolean
}
export type TabsRootEmits<T extends StringOrNumber = StringOrNumber> = {
  /** Event handler called when the value changes */
  'update:modelValue': [payload: T]
}

export const [injectTabsRootContext, provideTabsRootContext]
  = createContext<TabsRootContext>('TabsRoot')
</script>

<script setup lang="ts" generic="T extends StringOrNumber = StringOrNumber">
import { ref, shallowRef, toRefs } from 'vue'
import { Primitive } from '@/components/Primitive'

const props = withDefaults(defineProps<TabsRootProps<T>>(), {
  orientation: 'horizontal',
  activationMode: 'automatic',
  unmountOnHide: true,
})
const emits = defineEmits<TabsRootEmits<T>>()

defineSlots<{
  default?: (props: {
    /** Current input values */
    modelValue: typeof modelValue.value
  }) => any
}>()

const { orientation, unmountOnHide, dir: propDir } = toRefs(props)
const dir = useDirection(propDir)
useForwardExpose()

const modelValue = useVModel<TabsRootProps<T>, 'modelValue', 'update:modelValue'>(props, 'modelValue', emits, {
  defaultValue: props.defaultValue,
  passive: (props.modelValue === undefined) as false,
})

const tabsList = ref<any>()
const contentIds = shallowRef<Set<StringOrNumber>>(new Set())
const triggers = shallowRef<Map<StringOrNumber, any>>(new Map())
const layoutTick = ref(0)

provideTabsRootContext({
  modelValue,
  changeModelValue: (value: StringOrNumber) => {
    modelValue.value = value as T
  },
  orientation,
  dir,
  unmountOnHide,
  activationMode: props.activationMode,
  baseId: useId(undefined, 'vy-tabs'),
  tabsList,
  contentIds,
  registerContent: (value: StringOrNumber) => {
    contentIds.value = new Set([...contentIds.value, value])
  },
  unregisterContent: (value: StringOrNumber) => {
    const newSet = new Set(contentIds.value)
    newSet.delete(value)
    contentIds.value = newSet
  },
  triggers,
  registerTrigger: (value: StringOrNumber, el: any) => {
    const next = new Map(triggers.value)
    next.set(value, el)
    triggers.value = next
  },
  unregisterTrigger: (value: StringOrNumber) => {
    const next = new Map(triggers.value)
    next.delete(value)
    triggers.value = next
  },
  layoutTick,
  notifyLayoutChange: () => {
    layoutTick.value = layoutTick.value + 1
  },
})
</script>

<template>
  <Primitive
    :dir="dir"
    :data-orientation="orientation"
    :as-child="asChild"
    :as="as"
  >
    <slot :model-value="modelValue" />
  </Primitive>
</template>
