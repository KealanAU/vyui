<!-- Adapted from reka-ui (MIT) — https://github.com/unovue/reka-ui -->
<script lang="ts">
import type { ComputedRef, Ref } from 'vue'
import { createContext } from '@/shared'

export interface ToastProviderProps {
  /** An author-localized label for each toast. */
  label?: string
  /** Time in milliseconds a toast remains visible before auto-dismissing. `0` disables it. */
  duration?: number
  /** When `true`, the toast stack starts in the expanded state. */
  expandByDefault?: boolean
}

export interface ToastProviderContext {
  label: Ref<string>
  duration: Ref<number>
  /** Whether the stack is fanned out (`true`) or collapsed (`false`). */
  expanded: Ref<boolean>
  expand: () => void
  collapse: () => void
  toggleExpanded: () => void
  /** Number of registered (mounted) toasts. */
  count: ComputedRef<number>
  registerToast: (id: symbol) => void
  unregisterToast: (id: symbol) => void
  /** Reports a toast's measured height (px) so consumers can lay out an expanded stack. */
  setToastHeight: (id: symbol, height: number) => void
  /** Position of a toast counted from the front — `0` is the newest/front toast. */
  indexOf: (id: symbol) => number
  /** Combined height (px) of every toast stacked in front of `id`. */
  heightBefore: (id: symbol) => number
}

export const [injectToastProviderContext, provideToastProviderContext]
  = createContext<ToastProviderContext>('ToastProvider')
</script>

<script setup lang="ts">
import { computed, reactive, ref, toRef } from 'vue'

const props = withDefaults(defineProps<ToastProviderProps>(), {
  label: 'Notification',
  duration: 5000,
  expandByDefault: false,
})

defineSlots<{
  default?: (props: { expanded: boolean, count: number, expand: () => void, collapse: () => void }) => any
}>()

// Registration order — the most recently registered toast is the front toast.
const order = ref<symbol[]>([])
const heights = reactive(new Map<symbol, number>())
const expanded = ref(props.expandByDefault)

const count = computed(() => order.value.length)

function registerToast(id: symbol) {
  if (!order.value.includes(id))
    order.value = [...order.value, id]
}
function unregisterToast(id: symbol) {
  order.value = order.value.filter(x => x !== id)
  heights.delete(id)
}
function setToastHeight(id: symbol, height: number) {
  heights.set(id, height)
}

function indexOf(id: symbol): number {
  const pos = order.value.indexOf(id)
  return pos < 0 ? 0 : order.value.length - 1 - pos
}

function heightBefore(id: symbol): number {
  const myIndex = indexOf(id)
  let sum = 0
  for (const tid of order.value) {
    if (indexOf(tid) < myIndex)
      sum += heights.get(tid) ?? 0
  }
  return sum
}

function expand() { expanded.value = true }
function collapse() { expanded.value = false }
function toggleExpanded() { expanded.value = !expanded.value }

provideToastProviderContext({
  label: toRef(props, 'label'),
  duration: toRef(props, 'duration'),
  expanded,
  expand,
  collapse,
  toggleExpanded,
  count,
  registerToast,
  unregisterToast,
  setToastHeight,
  indexOf,
  heightBefore,
})
</script>

<template>
  <slot :expanded="expanded" :count="count" :expand="expand" :collapse="collapse" />
</template>
