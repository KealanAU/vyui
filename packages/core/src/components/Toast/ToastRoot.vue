<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { PrimitiveProps } from '@/components/Primitive'
import { createContext } from '@/shared'

export interface ToastRootProps extends PrimitiveProps {
  /** The controlled open state. Can be bound with `v-model:open`. */
  open?: boolean
  /** The open state when initially rendered. */
  defaultOpen?: boolean
  /** Time in milliseconds before auto-dismissing. Falls back to the provider. `0` disables it. */
  duration?: number
  /** The toast's importance. */
  type?: 'foreground' | 'background'
}

export type ToastRootEmits = {
  /** Event handler called when the open state changes. */
  'update:open': [value: boolean]
}

export interface ToastRootContext {
  onClose: () => void
}

export const [injectToastRootContext, provideToastRootContext]
  = createContext<ToastRootContext>('ToastRoot')
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { Primitive } from '@/components/Primitive'
import { useForwardExpose } from '@/shared'
import { useA11y, useResizeObserver, useStandardVModelOf } from '@/shared/composables'
import { injectToastProviderContext } from './ToastProvider.vue'

const props = withDefaults(defineProps<ToastRootProps>(), {
  as: 'view',
  // `open: undefined` is required: without an explicit default, Vue coerces an
  // absent Boolean prop to `false`, so `props.open === undefined` is never
  // true, `useVModel` never runs passive, and `defaultOpen` is ignored.
  open: undefined,
  defaultOpen: true,
  type: 'foreground',
})
const emits = defineEmits<ToastRootEmits>()

defineSlots<{
  default?: (props: {
    open: boolean
    /** Position from the front of the stack — `0` is this/the newest toast. */
    index: number
    /** Total number of mounted toasts. */
    count: number
    /** Whether this is the front (newest) toast. */
    isFront: boolean
    /** Whether the stack is fanned out. */
    expanded: boolean
    /** Combined height (px) of the toasts in front of this one. */
    heightBefore: number
    expand: () => void
    collapse: () => void
    toggleExpanded: () => void
    /** Bind to `@layoutchange` on the visible toast element to feed `heightBefore`. */
    onLayoutChange: (event: any) => void
  }) => any
}>()

const { forwardRef } = useForwardExpose()
const provider = injectToastProviderContext()

const open = useStandardVModelOf<boolean>(props, 'open', emits)

// A stable identity for this toast within the provider registry.
const id = Symbol('toast')

const index = computed(() => provider.indexOf(id))
const count = computed(() => provider.count.value)
const isFront = computed(() => index.value === 0)
const heightBefore = computed(() => provider.heightBefore(id))

// Report layout height so a consumer can lay out an expanded stack — the
// geometry data lives in the primitive; the transforms stay downstream.
const { onLayoutChange } = useResizeObserver((rect) => {
  provider.setToastHeight(id, rect.height)
})

let timer: ReturnType<typeof setTimeout> | undefined

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
}

function startTimer() {
  clearTimer()
  // Auto-dismiss pauses while the stack is expanded (Sonner-style).
  if (provider.expanded.value)
    return
  const duration = props.duration ?? provider.duration.value
  if (duration > 0)
    timer = setTimeout(() => { open.value = false }, duration)
}

function onClose() {
  open.value = false
}

watch(open, (isOpen) => {
  if (isOpen)
    startTimer()
  else
    clearTimer()
})

watch(() => provider.expanded.value, (isExpanded) => {
  if (isExpanded)
    clearTimer()
  else if (open.value)
    startTimer()
})

onMounted(() => {
  provider.registerToast(id)
  if (open.value)
    startTimer()
})
onUnmounted(() => {
  clearTimer()
  provider.unregisterToast(id)
})

provideToastRootContext({ onClose })

const a11y = useA11y(() => ({
  role: props.type === 'foreground' ? 'alert' : 'summary',
}))
</script>

<template>
  <Primitive
    v-if="open"
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    v-bind="a11y"
    :data-state="open ? 'open' : 'closed'"
    :data-type="type"
    :data-front="isFront ? '' : undefined"
    :data-expanded="provider.expanded.value ? '' : undefined"
  >
    <slot
      :open="open"
      :index="index"
      :count="count"
      :is-front="isFront"
      :expanded="provider.expanded.value"
      :height-before="heightBefore"
      :expand="provider.expand"
      :collapse="provider.collapse"
      :toggle-expanded="provider.toggleExpanded"
      :on-layout-change="onLayoutChange"
    />
  </Primitive>
</template>
